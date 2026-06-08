using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaccoApi.Data;
using SaccoApi.Models;
using SaccoApi.DTOs;

namespace SaccoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MembersController : ControllerBase
    {
        private readonly SaccoDbContext _context;

        public MembersController(SaccoDbContext context)
        {
            _context = context;
        }

        // GET: api/members
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Member>>> GetAll()
        {
            return await _context.Members.ToListAsync();
        }

        // GET: api/members/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Member>> GetById(int id)
        {
            var member = await _context.Members.FindAsync(id);
            if (member == null) return NotFound();
            return member;
        }

        // GET: api/members/pending
[HttpGet("pending")]
public async Task<ActionResult<IEnumerable<Member>>> GetPending()
{
    return await _context.Members
        .Where(m => m.Status == MemberStatus.Inactive)
        .OrderBy(m => m.DateJoined)
        .ToListAsync();
}

        // POST: api/members
       [HttpPost]
public async Task<ActionResult<Member>> Create(CreateMemberDto dto)
{
    var member = new Member
    {
        FullName = dto.FullName,
        PhoneNumber = dto.PhoneNumber,
        Email = dto.Email,
        Role = dto.Role,
        Status = MemberStatus.Active,
        DateJoined = DateTime.UtcNow
    };

    _context.Members.Add(member);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetById), new { id = member.Id }, member);
}

        // PUT: api/members/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Member member)
        {
            if (id != member.Id) return BadRequest();

            _context.Entry(member).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Members.Any(m => m.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // PATCH: api/members/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] MemberStatus status)
        {
            var member = await _context.Members.FindAsync(id);
            if (member == null) return NotFound();

            member.Status = status;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}