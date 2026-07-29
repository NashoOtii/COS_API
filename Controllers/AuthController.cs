using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SaccoApi.Data;
using SaccoApi.DTOs;
using SaccoApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
namespace SaccoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SaccoDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            SaccoDbContext context,
            IConfiguration config)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _config = config;
        }

        // POST: api/auth/register
[HttpPost("register")]
[EnableRateLimiting("login")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    bool phoneExists = await _context.Members
        .AnyAsync(m => m.PhoneNumber == dto.PhoneNumber);

    if (phoneExists) 
        return BadRequest("A member with this phone number already exists.");

    if (!Enum.TryParse<MemberRole>(dto.Role, ignoreCase: true, out var memberRole))
        return BadRequest($"Invalid role '{dto.Role}'. Valid roles: Member, Treasurer, Secretary, Chairperson."); 

    if (memberRole != MemberRole.Member)
    {
        bool roleAlreadyTaken = await _context.Members
            .AnyAsync(m => m.Role == memberRole && m.Status == MemberStatus.Active);
        if (roleAlreadyTaken) 
            return BadRequest($"The {dto.Role} position is already filled.");
    }    

    // Use EF Core Execution Strategy for PostgreSQL connection retries
    var strategy = _context.Database.CreateExecutionStrategy();

    return await strategy.ExecuteAsync<IActionResult>(async () =>
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try 
        {
            var user = new IdentityUser
            {
                UserName = dto.PhoneNumber.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? $"{dto.PhoneNumber.Trim()}@cos.placeholder" : dto.Email.Trim()
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) 
                return BadRequest(result.Errors.Select(e => e.Description));

            var roleName = memberRole.ToString();
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole(roleName));

            var roleResult = await _userManager.AddToRoleAsync(user, roleName);
            if (!roleResult.Succeeded) 
                return BadRequest(roleResult.Errors.Select(e => e.Description));

            // Executive roles (Treasurer, Chairperson, Secretary) are immediately active to serve as admins.
            // Regular Members remain Inactive until executive approval.
            var initialStatus = memberRole != MemberRole.Member ? MemberStatus.Active : MemberStatus.Inactive;

            var member = new Member
            {
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                Role = memberRole,
                Status = initialStatus, 
                DateJoined = DateTime.UtcNow,
                ApplicationUserId = user.Id
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new {
                Message = "Account created successfully.",
                MemberId = member.Id
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Registration failed: {ex.Message}");
        }
    });
}

        // PUT: api/auth/questionnaire/{memberId}
[HttpPut("questionnaire/{memberId}")]
public async Task<IActionResult> SubmitQuestionnaire(int memberId, [FromBody] QuestionnaireDto dto)
{
    var member = await _context.Members.FindAsync(memberId);
    if (member == null) return NotFound("Member record not found.");

    // Update the record with questionnaire answers
    member.Motivation = dto.Motivation;
    member.FinancialGoal = dto.FinancialGoal;
    member.WeeklyCommitment = dto.WeeklyCommitment;
    member.ValueAlignment = dto.ValueAlignment;
    member.Contribution = dto.Contribution;

    await _context.SaveChangesAsync();

    return Ok(new { Message = "Questionnaire submitted. Your account is pending executive approval." });
}

        // POST: api/auth/login
        [HttpPost("login")]
        [EnableRateLimiting("login")] // <--- added this to protect against brute-force attacks
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            // Find user by phone number
            var user = await _userManager.FindByNameAsync(dto.PhoneNumber);
            if (user == null)
                return Unauthorized("Invalid phone number or password.");

            var passwordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!passwordValid)
                return Unauthorized("Invalid phone number or password.");

            // Get linked member record
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.ApplicationUserId == user.Id);

            if (member == null || member.Status == MemberStatus.Inactive)
                return Unauthorized(
                    "Your account is pending approval from the executive team. " +
                    "Please wait for confirmation before logging in.");

            var roles = await _userManager.GetRolesAsync(user);

            // Build JWT token
            var token = GenerateToken(user, roles, member);

            return Ok(new
            {
                Token = token,
                MemberId = member?.Id,
                FullName = member?.FullName,
                Role = roles.FirstOrDefault()
            });
        }

        private string GenerateToken(
            IdentityUser user,
            IList<string> roles,
            Member? member)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName!),
                new("MemberId", member?.Id.ToString() ?? "")
            };

            // Add each role as a claim
            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(
                    double.Parse(jwtSettings["ExpiryHours"]!)),
                signingCredentials: new SigningCredentials(
                    key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}