namespace CleanApp.API;

public static class ClientIpResolver
{
    public static string GetClientIp(HttpContext http)
    {
        var forwarded = http.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault();
            if (!string.IsNullOrEmpty(first) &&
                !string.Equals(first, "unknown", StringComparison.OrdinalIgnoreCase))
                return first;
        }

        var realIp = http.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
            return realIp.Trim();

        var remote = http.Connection.RemoteIpAddress;
        if (remote is null)
            return "unknown";

        return remote.ToString();
    }
}
