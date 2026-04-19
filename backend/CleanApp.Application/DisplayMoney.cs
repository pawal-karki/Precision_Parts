using System.Globalization;

namespace CleanApp.Application;

/// <summary>
/// Display strings for money sent to the SPA. Do not use <c>ToString("C", CultureInfo.InvariantCulture)</c> —
/// invariant culture uses the generic currency sign (¤), not a real symbol.
/// Aligns with <c>frontend/src/lib/currency.js</c> (Rs. prefix, invariant digit grouping).
/// </summary>
public static class DisplayMoney
{
    public static string Format(decimal amount, int decimalPlaces = 2)
    {
        var fmt = decimalPlaces <= 0 ? "N0" : $"N{decimalPlaces}";
        return $"Rs. {amount.ToString(fmt, CultureInfo.InvariantCulture)}";
    }
}
