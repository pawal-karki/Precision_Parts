namespace CleanApp.Application.Auth;

public class AuthResponseDto
{
    public Guid Id { get; set; }
    public int PublicId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string? Token { get; set; }
}
