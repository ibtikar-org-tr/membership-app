export function colorForMembershipNumber(membershipNumber: string) {
  let hash = 0
  for (let index = 0; index < membershipNumber.length; index += 1) {
    hash = membershipNumber.charCodeAt(index) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 45%)`
}
