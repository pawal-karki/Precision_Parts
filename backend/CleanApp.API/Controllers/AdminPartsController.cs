using CleanApp.Application.Parts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for managing vehicle parts inventory,
/// including listing, creating, updating, deleting, and uploading part images.
/// Accessible by Admin and Staff roles for read operations; write operations are Admin-only.
/// </summary>
[ApiController]
[Route("api/admin/parts")]
[Authorize]
public class AdminPartsController : ControllerBase
{
    private readonly IPartsService _parts;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminPartsController"/> with the required parts service.
    /// </summary>
    /// <param name="parts">The service responsible for parts business logic.</param>
    public AdminPartsController(IPartsService parts) => _parts = parts;

    /// <summary>
    /// Retrieves the full list of parts available in the inventory.
    /// Accessible by Admin, Staff, and Customer roles.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of all parts.</returns>
    [HttpGet]
    [Authorize(Roles = "Admin,Staff,Customer")]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _parts.ListForAdminAsync(cancellationToken));

    /// <summary>
    /// Creates a new part entry in the inventory.
    /// Requires Admin authorization.
    /// </summary>
    /// <param name="dto">The data transfer object containing part creation details.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 201 Created with the new part's ID on success;
    /// 400 Bad Request if validation fails;
    /// 409 Conflict if a duplicate part already exists.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PartCreateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var id = await _parts.CreateAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing part record identified by its unique GUID.
    /// Requires Admin authorization.
    /// </summary>
    /// <param name="id">The unique identifier of the part to update.</param>
    /// <param name="dto">The data transfer object containing the updated part details.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the part does not exist.
    /// </returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PartUpdateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _parts.UpdateAsync(id, dto, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Permanently removes a part from the inventory by its unique GUID.
    /// Requires Admin authorization.
    /// </summary>
    /// <param name="id">The unique identifier of the part to delete.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the part does not exist.
    /// </returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _parts.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Uploads an image file for a part and returns its publicly accessible relative URL.
    /// Accepted formats: JPG, JPEG, PNG, WebP. Requires Admin authorization.
    /// </summary>
    /// <param name="file">The image file to upload via multipart form data.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the relative image URL on success;
    /// 400 Bad Request if no file is provided or the file type is unsupported.
    /// </returns>
    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { error = "Invalid file type. Only JPG, PNG and WebP are allowed." });

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "parts");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativePath = $"/uploads/parts/{fileName}";
        return Ok(new { imageUrl = relativePath });
    }
}