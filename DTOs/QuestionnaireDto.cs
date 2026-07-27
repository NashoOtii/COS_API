using System.ComponentModel.DataAnnotations;

namespace SaccoApi.DTOs
{
    public class QuestionnaireDto
    {
        [Required]
        public string Motivation { get; set; } = string.Empty;

        [Required]
        public string FinancialGoal { get; set; } = string.Empty;

        [Required]
        public string WeeklyCommitment { get; set; } = string.Empty;

        [Required]
        public string ValueAlignment { get; set; } = string.Empty;

        [Required]
        public string Contribution { get; set; } = string.Empty;
    }
}