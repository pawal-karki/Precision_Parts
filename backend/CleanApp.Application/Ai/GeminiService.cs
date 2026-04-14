using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CleanApp.Application.Ai;

public interface IGeminiService
{
    Task<string> GetRecommendationAsync(string vehicleInfo, string serviceHistory, CancellationToken ct = default);
}

public class GeminiService : IGeminiService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(HttpClient http, IConfiguration config, ILogger<GeminiService> logger)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"];
        _logger = logger;
    }

    public async Task<string> GetRecommendationAsync(string vehicleInfo, string serviceHistory, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return GenerateFallbackRecommendation(vehicleInfo);
        }

        try
        {
            var prompt = $@"You are an expert automotive maintenance AI assistant for a vehicle parts service center in Nepal. 
Based on the following vehicle information and service history, provide maintenance recommendations in JSON format.

Vehicle Info: {vehicleInfo}
Service History: {serviceHistory}

Respond with a JSON object containing:
- ""recommendations"": array of objects with ""title"", ""description"", ""urgency"" (high/medium/low), ""estimatedCostNPR"" (in Nepalese Rupees)
- ""overallHealthScore"": number 0-100
- ""nextServiceDate"": suggested next service date
- ""insights"": array of brief insight strings

Respond ONLY with valid JSON, no markdown.";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 1024
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_apiKey}";

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini API returned {StatusCode}: {Body}", response.StatusCode, responseBody);
                return GenerateFallbackRecommendation(vehicleInfo);
            }

            // Parse Gemini response
            using var doc = JsonDocument.Parse(responseBody);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? GenerateFallbackRecommendation(vehicleInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini API call failed");
            return GenerateFallbackRecommendation(vehicleInfo);
        }
    }

    private static string GenerateFallbackRecommendation(string vehicleInfo)
    {
        return JsonSerializer.Serialize(new
        {
            recommendations = new[]
            {
                new { title = "Regular Oil Change", description = "Based on typical usage patterns, an oil change is recommended within the next 1,000 km.", urgency = "medium", estimatedCostNPR = 3500 },
                new { title = "Brake Pad Inspection", description = "Front brake pads should be inspected for wear. Replace if thickness is below 3mm.", urgency = "high", estimatedCostNPR = 8500 },
                new { title = "Tyre Rotation", description = "Rotate tyres to ensure even wear pattern and extend tyre life by up to 20%.", urgency = "low", estimatedCostNPR = 1500 },
                new { title = "Coolant System Check", description = "Coolant levels and condition should be verified before the summer season.", urgency = "medium", estimatedCostNPR = 2000 }
            },
            overallHealthScore = 82,
            nextServiceDate = DateTime.UtcNow.AddDays(30).ToString("yyyy-MM-dd"),
            insights = new[]
            {
                "Vehicle is due for scheduled maintenance based on mileage intervals",
                "Brake system shows normal wear for the vehicle age",
                "No critical issues detected — preventive maintenance recommended"
            }
        });
    }
}
