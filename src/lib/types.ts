export type SetAside = 'SB' | 'WOSB' | '8A' | 'HUBZONE' | 'UNRESTRICTED'

export type Solicitation = {
  sol_number: string
  nsn: string
  fsc: string
  description: string
  posted_date: string
  response_date: string
  quantity: number
  unit: string
  set_aside: SetAside
  url: string
}
