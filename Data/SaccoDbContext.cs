using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SaccoApi.Models;

namespace SaccoApi.Data
{
    
    public class SaccoDbContext : IdentityDbContext<IdentityUser>
    {
        public SaccoDbContext(DbContextOptions<SaccoDbContext> options) : base(options) { }

        public DbSet<Member> Members { get; set; }
        public DbSet<AcademicCycle> Cycles { get; set; }
        public DbSet<Contribution> Contributions { get; set; }
        public DbSet<Loan> Loans { get; set; }
        public DbSet<LoanGuarantor> LoanGuarantors { get; set; }
        public DbSet<LoanRepayment> LoanRepayments { get; set; }
        public DbSet<Investment> Investments { get; set; }
        public DbSet<CycleDividend> CycleDividends { get; set; }
        public DbSet<Penalty> Penalties { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Member>()
                .HasIndex(m => m.PhoneNumber)
                .IsUnique();

            modelBuilder.Entity<Contribution>()
                .HasIndex(c => new { c.MemberId, c.CycleId, c.WeekNumber })
                .IsUnique();

            modelBuilder.Entity<LoanGuarantor>()
                .HasIndex(lg => new { lg.LoanId, lg.MemberId })
                .IsUnique();

            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }

            modelBuilder.Entity<Contribution>()
                .HasOne(c => c.RecordedBy)
                .WithMany()
                .HasForeignKey(c => c.RecordedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Loan>()
                .HasOne(l => l.ApprovedBy)
                .WithMany()
                .HasForeignKey(l => l.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LoanGuarantor>()
                .HasOne(lg => lg.Member)
                .WithMany(m => m.GuaranteedLoans)
                .HasForeignKey(lg => lg.MemberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LoanRepayment>()
                .HasOne(r => r.RecordedBy)
                .WithMany()
                .HasForeignKey(r => r.RecordedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AuditLog>()
                .HasOne(a => a.PerformedBy)
                .WithMany()
                .HasForeignKey(a => a.PerformedById)
                .OnDelete(DeleteBehavior.Restrict);
        }

        
    }
}