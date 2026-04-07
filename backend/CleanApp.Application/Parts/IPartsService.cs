namespace CleanApp.Application.Parts;

public interface IPartsService
{
    Task<IReadOnlyList<PartAdminRowDto>> ListForAdminAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(PartCreateDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, PartUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
  