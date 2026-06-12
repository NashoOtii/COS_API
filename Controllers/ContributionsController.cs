using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaccoApi.Data;
using SaccoApi.Models;
using SaccoApi.DTOs;

namespace SaccoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContributionsController : ControllerBase
    {
        private readonly SaccoDbContext _context;

        public ContributionsController(SaccoDbContext context)
        {
            _context = context;
        }

        // GET: api/contributions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Contribution>>> GetAll()
        {
            return await _context.Contributions
                .Include(c => c.Member)
                .Include(c => c.Cycle)
                .OrderByDescending(c => c.DateRecorded)
                .ToListAsync();
        }

        // GET: api/contributions/cycle/5
        [HttpGet("cycle/{cycleId}")]
        public async Task<ActionResult<IEnumerable<Contribution>>> GetByCycle(int cycleId)
        {
            return await _context.Contributions
                .Include(c => c.Member)
                .Where(c => c.CycleId == cycleId)
                .OrderBy(c => c.WeekNumber)
                .ToListAsync();
        }

        // GET: api/contributions/member/5
        [HttpGet("member/{memberId}")]
        public async Task<ActionResult<IEnumerable<Contribution>>> GetByMember(int memberId)
        {
            return await _context.Contributions
                .Include(c => c.Cycle)
                .Where(c => c.MemberId == memberId)
                .OrderByDescending(c => c.DateRecorded)
                .ToListAsync();
        }

        // GET: api/contributions/member/5/streak
        [HttpGet("member/{memberId}/streak")]
        public async Task<IActionResult> GetStreak(int memberId)
        {
            var contributions = await _context.Contributions
                .Where(c => c.MemberId == memberId)
                .OrderByDescending(c => c.WeekNumber)
                .ToListAsync();

            int streak = 0;
            foreach (var c in contributions)
            {
                if (c.Status == ContributionStatus.Paid) streak++;
                else break;
            }

            return Ok(new { MemberId = memberId, CurrentStreak = streak });
        }
       
   // POST: api/contributions
[HttpPost]
public async Task<ActionResult<Contribution>> Create(CreateContributionDto dto)
{
    var cycle = await _context.Cycles.FindAsync(dto.CycleId);
    if (cycle == null || cycle.Status != CycleStatus.Active)
        return BadRequest("Contributions can only be logged for an active cycle.");

    var member = await _context.Members.FindAsync(dto.MemberId);
    if (member == null || member.Status != MemberStatus.Active)
        return BadRequest("Member not found or inactive.");

    bool duplicate = await _context.Contributions.AnyAsync(c =>
        c.MemberId == dto.MemberId &&
        c.CycleId == dto.CycleId &&
        c.WeekNumber == dto.WeekNumber);

    if (duplicate)
        return BadRequest($"Contribution for week {dto.WeekNumber} already exists for this member.");

    var contribution = new Contribution
    {
        MemberId = dto.MemberId,
        CycleId = dto.CycleId,
        Amount = dto.Amount,
        WeekNumber = dto.WeekNumber,
        Status = dto.Status,
        RecordedById = dto.RecordedById,
        DateRecorded = DateTime.UtcNow
    };

    _context.Contributions.Add(contribution);
    await _context.SaveChangesAsync();

    // FIXED: Returns a clean, flat object to prevent circular serialization 
    return Ok(new {
        id = contribution.Id,
        memberId = contribution.MemberId,
        cycleId = contribution.CycleId,
        amount = contribution.Amount,
        weekNumber = contribution.WeekNumber,
        status = contribution.Status.ToString()
    });
}
        // PATCH: api/contributions/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] ContributionStatus status)
        {
            var contribution = await _context.Contributions.FindAsync(id);
            if (contribution == null) return NotFound();

            contribution.Status = status;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}