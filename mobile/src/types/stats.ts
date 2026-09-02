export interface MemberStats {
  overview: {
    totalMembers: number
    cycleGrowthPercentage: number
    telegramActive: number
    newMembers: number
    countriesCount: number
    universitiesCount: number
  }
  genderDistribution: {
    maleCount: number
    femaleCount: number
    malePercentage: number
    femalePercentage: number
  }
  ageDistribution: unknown
}
