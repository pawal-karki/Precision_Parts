namespace CleanApp.Infrastructure.Email;

public sealed class ResendEmailOptions
{
    public const string SectionName = "Resend";

    /// <summary>Your verified Resend API key.</summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>The "from" address used for all outgoing emails. Must match your verified domain.</summary>
    public string From { get; set; } = "Precision Parts <noreply@precisionparts.app>";
}
