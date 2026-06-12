using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaccoApi.Data;
using SaccoApi.Models;
using SaccoApi.DTOs;

namespace SaccoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CyclesController : ControllerBase
    {
        private readonly SaccoDbContext _context;

        public CyclesController(SaccoDbContext context)
        {
            _context = context;
        }

        // GET: api/cycles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AcademicCycle>>> GetAll()
        {
            return await _context.Cycles
                .OrderByDescending(c => c.StartDate)
                .ToListAsync();
        }

        // GET: api/cycles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AcademicCycle>> GetById(int id)
        {
            var cycle = await _context.Cycles
                .Include(c => c.Contributions)
                .Include(c => c.Loans)
                .Include(c => c.Investments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cycle == null) return NotFound();
            return cycle;
        }

        // GET: api/cycles/active
        [HttpGet("active")]
        public async Task<ActionResult<AcademicCycle>> GetActive()
        {
            var cycle = await _context.Cycles
                .FirstOrDefaultAsync(c => c.Status == CycleStatus.Active);

            if (cycle == null) return NotFound("No active cycle found.");
            return cycle;
        }
        // POST: api/cycles
[HttpPost]
public async Task<ActionResult<AcademicCycle>> Create([FromBody] CreateCycleDto dto)
{
    // 1. Guard against a completely null payload
    if (dto == null)
    {
        return BadRequest("Invalid cycle data payload.");
    }

    try
    {
        bool hasActive = await _context.Cycles
            .AnyAsync(c => c.Status == CycleStatus.Active);

        if (hasActive)
            return BadRequest("An active cycle already exists. Close it before starting a new one.");

        var cycle = new AcademicCycle
        {
            Name = dto.Name,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            WeeklyContributionAmount = dto.WeeklyContributionAmount,
            MaxLoanAmount = dto.MaxLoanAmount,
            Status = CycleStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _context.Cycles.Add(cycle);
        await _context.SaveChangesAsync();

        // 2. Return a safe flat object instead of the raw entity to prevent JSON circular loop crashes
        return CreatedAtAction(nameof(GetById), new { id = cycle.Id }, new {
            id = cycle.Id,
            name = cycle.Name,
            startDate = cycle.StartDate,
            endDate = cycle.EndDate,
            status = cycle.Status.ToString()
        });
    }
    catch (Exception ex)
    {
        // This will print cleanly to your Render log dashboard
        Console.WriteLine($"[CRITICAL] Error creating cycle: {ex.Message}");
        Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        
        // This bypasses the global 500 error and sends a clean JSON payload back to React
        return StatusCode(500, new { 
            message = "An internal error occurred while creating the cycle.", 
            error = ex.Message 
        });
    }
}

        // PATCH: api/cycles/5/close
        [HttpPatch("{id}/close")]
        public async Task<IActionResult> Close(int id)
        {
            var cycle = await _context.Cycles.FindAsync(id);
            if (cycle == null) return NotFound();

            if (cycle.Status == CycleStatus.Archived)
                return BadRequest("Cycle is already archived.");

            // Check for any unpaid loans before allowing close
            bool hasActiveLoans = await _context.Loans
                .AnyAsync(l => l.CycleId == id &&
                          (l.Status == LoanStatus.Active || l.Status == LoanStatus.Approved));

            if (hasActiveLoans)
                return BadRequest("Cannot close cycle with outstanding loans. Resolve all active loans first.");

            cycle.Status = CycleStatus.Closing;
            cycle.EndDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/cycles/5/archive
        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> Archive(int id)
        {
            var cycle = await _context.Cycles.FindAsync(id);
            if (cycle == null) return NotFound();

            if (cycle.Status != CycleStatus.Closing)
                return BadRequest("Only a closing cycle can be archived.");

            cycle.Status = CycleStatus.Archived;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/cycles/5/summary
        [HttpGet("{id}/summary")]
        public async Task<IActionResult> GetSummary(int id)
        {
            var cycle = await _context.Cycles.FindAsync(id);
            if (cycle == null) return NotFound();

            var totalContributions = await _context.Contributions
                .Where(c => c.CycleId == id && c.Status == ContributionStatus.Paid)
                .SumAsync(c => c.Amount);

            var totalLoansIssued = await _context.Loans
                .Where(l => l.CycleId == id && l.Status != LoanStatus.Pending)
                .SumAsync(l => l.Principal);

            var totalInterestEarned = await _context.Loans
                .Where(l => l.CycleId == id && l.Status == LoanStatus.Repaid)
                .SumAsync(l => l.FlatFee);

            var totalPenalties = await _context.Penalties
                .Where(p => p.CycleId == id && p.IsPaid)
                .SumAsync(p => p.Amount);

            var summary = new
            {
                CycleId = id,
                CycleName = cycle.Name,
                Status = cycle.Status.ToString(),
                TotalContributions = totalContributions,
                TotalLoansIssued = totalLoansIssued,
                TotalInterestEarned = totalInterestEarned,
                TotalPenaltiesCollected = totalPenalties,
                PoolBalance = totalContributions + totalInterestEarned + totalPenalties - totalLoansIssued
            };

            return Ok(summary);
        }
    }
}