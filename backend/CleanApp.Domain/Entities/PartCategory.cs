namespace CleanApp.Domain.Entities;

public class PartCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ICollection<Part> Parts { get; set; } = new List<Part>();
}
     