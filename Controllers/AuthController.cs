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
    Console.WriteLine("========== REGISTER START ==========");

    if (dto == null)
        return BadRequest("Registration data is required.");

         Console.WriteLine("1. Request received");

    var phoneNumber = dto.PhoneNumber.Trim();

    Console.WriteLine("2. Checking Members table...");

    // 1. Check if phone/user exists in Members OR Identity
    bool memberExists = await _context.Members.AnyAsync(m => m.PhoneNumber == phoneNumber);
    if (memberExists) 
        return BadRequest("A member with this phone number already exists.");

         Console.WriteLine($"3. Member exists = {memberExists}");

    var existingIdentityUser = await _userManager.FindByNameAsync(phoneNumber);
    if (existingIdentityUser != null)
        return BadRequest("An account with this phone number is already registered.");

        Console.WriteLine("4. Identity lookup complete");

    // 2. Validate Role
    if (!Enum.TryParse<MemberRole>(dto.Role, ignoreCase: true, out var memberRole))
        return BadRequest($"Invalid role '{dto.Role}'. Valid roles: Member, Treasurer, Secretary, Chairperson."); 

    // 3. Enforce Executive Role Uniqueness
    if (memberRole != MemberRole.Member)
    {
        bool roleAlreadyTaken = await _context.Members
            .AnyAsync(m => m.Role == memberRole && m.Status == MemberStatus.Active);
        if (roleAlreadyTaken) 
            return BadRequest($"The {dto.Role} position is already filled.");
    }    

    // 4. Create Identity User
    Console.WriteLine("Creating Identity user...");
    var user = new IdentityUser
    {
        //Id = Guid.NewGuid().ToString(),
        UserName = phoneNumber,
        PhoneNumber = phoneNumber,
        Email = string.IsNullOrWhiteSpace(dto.Email) 
            ? $"{phoneNumber}@cos.placeholder" 
            : dto.Email.Trim(),
        EmailConfirmed = true
    };

    var createResult = await _userManager.CreateAsync(user, dto.Password);
    if (!createResult.Succeeded) 
        return BadRequest(createResult.Errors.Select(e => e.Description));

    // 5. Role Assignment
    Console.WriteLine("Assigning role...");
    var roleName = memberRole.ToString();
    if (!await _roleManager.RoleExistsAsync(roleName))
        await _roleManager.CreateAsync(new IdentityRole(roleName));

    var roleResult = await _userManager.AddToRoleAsync(user, roleName);
    if (!roleResult.Succeeded)
    {
        await SafeDeleteUserAsync(user);
        return BadRequest(roleResult.Errors.Select(e => e.Description));
    }

    // 6. Create Member Record
    Console.WriteLine("Saving Member...");
    var initialStatus = memberRole != MemberRole.Member ? MemberStatus.Active : MemberStatus.Inactive;

    var member = new Member
    {
        FullName = dto.FullName.Trim(),
        PhoneNumber = phoneNumber,
        Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
        Role = memberRole,
        Status = initialStatus, 
        DateJoined = DateTime.UtcNow,
        ApplicationUserId = user.Id
    };

    try 
    {
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return Ok(new {
            Message = "Account created successfully.",
            MemberId = member.Id
        });
    }
    catch (Exception ex)
    {
        // Compensating action: clean up created user if member persistence fails
        //await SafeDeleteUserAsync(user);

        var innerError = ex.InnerException?.Message ?? ex.Message;
        Console.WriteLine($"=== REAL DB ERROR: {innerError} ===");
        return StatusCode(500, new
        {
            error = ex.Message,
            inner = ex.InnerException?.Message,
            stack = ex.InnerException?.StackTrace
        });
    }
}

private async Task SafeDeleteUserAsync(IdentityUser user)
{
    var result = await _userManager.DeleteAsync(user);

    if (!result.Succeeded)
    {
        throw new Exception(
            "Cleanup failed: " +
            string.Join(", ", result.Errors.Select(e => e.Description)));
    }
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