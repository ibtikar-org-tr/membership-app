export interface HomeStatsOverview {
  totalMembers: number
  cycleGrowthPercentage: number
  telegramActive: number
  newMembers: number
  countriesCount: number
  universitiesCount: number
}

export interface HomeStatsGenderDistribution {
  maleCount: number
  femaleCount: number
  malePercentage: number
  femalePercentage: number
}

export interface HomeStatsAgeDistributionItem {
  age: number
  count: number
}

export interface HomeStatsResponse {
  overview: HomeStatsOverview
  genderDistribution: HomeStatsGenderDistribution
  ageDistribution: HomeStatsAgeDistributionItem[]
}
