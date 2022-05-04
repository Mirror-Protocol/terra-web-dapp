type EncodedExecuteMsg = string
type EncodedPassCommandMsg = string

type DecodedExecuteMsg =
  | { whitelist: Whitelist }
  | { revoke_collateral_asset: RevokeCollateral }
  | { revoke_asset: RevokeAsset }
  | { pass_command: PassCommand }
  | { update_weight: UpdateWeight }
  | { update_config: Partial<GovConfig> }
  | { update_collateral_multiplier: UpdateCollateralMultiplier }
  | { spend: Spend }

type PassCommandMsg =
  | { update_asset: UpdateAsset }
  | { update_source_priority_list: UpdatePriority }
  | { remove_source: RemovePrice }
  | { whitelist_proxy: WhitelistProxy }

interface Whitelist {
  name: string
  symbol: string
  oracle_feeder: string
  oracle_proxy: string
  params: AssetParams
}

interface RevokeCollateral {
  asset: AssetInfo | NativeInfo
}

interface RevokeAsset {
  asset_token: string
  end_price: string
}

interface AssetParams {
  auction_discount: string
  min_collateral_ratio: string
  min_collateral_ratio_after_migration: string
  mint_period: number
  pre_ipo_price: string
}

interface UpdateAsset extends Partial<AssetParams> {
  asset_token: string
}

interface UpdateWeight {
  asset_token: string
  weight: string
}

interface UpdatePriority {
  symbol: string
  priority_list: [[string, number]]
}

interface RemovePrice {
  symbol: string
  proxy_addr: string
}

interface WhitelistProxy {
  proxy_addr: string
  provider_name: string
}

interface PassCommand {
  contract_addr: string
  msg: EncodedPassCommandMsg
}

type DecodedPassCommandMsg = { update_asset: UpdateAsset }

interface UpdateCollateralMultiplier {
  asset: AssetInfo
  multiplier: number
}

interface Spend {
  recipient: string
  amount: string
}

/* votes */
type VoteAnswer = "yes" | "no" | "abstain"
interface Voter {
  balance: string
  vote: VoteAnswer
  voter?: string
}

/* config */
interface GovConfig {
  admin_manager: string
  auth_admin_poll_config: {
    proposal_deposit: string
    quorum: string
    threshold: string
    voting_period: number
  }
  default_poll_config: {
    proposal_deposit: string
    quorum: string
    threshold: string
    voting_period: number
  }
  effective_delay: number
  migration_poll_config: {
    proposal_deposit: string
    quorum: string
    threshold: string
    voting_period: number
  }
  mirror_token: string
  owner: string
  poll_gas_limit: number
  snapshot_period: number
  voter_weight: string
}

/* state */
interface GovState {
  poll_count: number
  total_share: string
  total_deposit: string
  pending_voting_rewards: string
}
