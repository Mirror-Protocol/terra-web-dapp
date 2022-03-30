import { selector, useRecoilValue } from "recoil"
import { div, isInteger } from "../../libs/math"
import { percent } from "../../libs/num"
import { formatAsset } from "../../libs/parse"
import { fromBase64 } from "../../libs/formHelpers"
import { protocolQuery } from "../contract/protocol"
import { getProxyWhitelist } from "../contract/proxy"
import { Content } from "../../components/componentTypes"
import { PollType, ViewOnlyPollType } from "../../pages/Poll/CreatePoll"
import { AdminAction, ExecuteData, Poll, PollData } from "./poll"

const parsePollQuery = selector({
  key: "parsePoll",
  get: ({ get }) => {
    const { getSymbol, parseAssetInfo } = get(protocolQuery)
    const proxyWhitelist = get(getProxyWhitelist)

    const parseParams = (
      decoded: DecodedExecuteMsg,
      id: number,
      adminAction?: AdminAction
    ) => {
      const type =
        "whitelist" in decoded
          ? PollType.WHITELIST
          : "revoke_collateral_asset" in decoded
          ? PollType.DELIST_COLLATERAL
          : "revoke_asset" in decoded
          ? PollType.DELIST_ASSET
          : "pass_command" in decoded
          ? parsePassCommandType(decoded.pass_command)
          : "update_weight" in decoded
          ? PollType.INFLATION
          : "update_config" in decoded
          ? PollType.GOV_PARAM_UPDATE
          : "update_collateral_multiplier" in decoded
          ? PollType.COLLATERAL
          : "spend" in decoded
          ? PollType.COMMUNITY_SPEND
          : PollType.TEXT

      const parsed =
        "whitelist" in decoded
          ? parseWhitelist(decoded.whitelist)
          : "revoke_collateral_asset" in decoded
          ? parseRevokeCollateral(decoded.revoke_collateral_asset)
          : "revoke_asset" in decoded
          ? parseRevokeAsset(decoded.revoke_asset)
          : "pass_command" in decoded
          ? parsePassCommand(decoded.pass_command)
          : "update_weight" in decoded
          ? parseUpdateWeight(decoded.update_weight)
          : "update_config" in decoded
          ? parseUpdateConfig(decoded.update_config, adminAction)
          : "update_collateral_multiplier" in decoded
          ? parseUpdateCollateralMultiplier(
              decoded.update_collateral_multiplier
            )
          : "spend" in decoded
          ? parseSpend(decoded.spend)
          : {}

      return { type, ...parsed }
    }

    const parseAdminAction = (adminAction: AdminAction) => {
      const type =
        "execute_migrations" in adminAction
          ? ViewOnlyPollType.MIGRATION
          : "authorize_claim" in adminAction
          ? ViewOnlyPollType.AUTHORIZE
          : "update_config" in adminAction
          ? adminAction.update_config.voter_weight ||
            adminAction.update_config.effective_delay
            ? PollType.GOV_PARAM_UPDATE
            : PollType.POLL_PARAM_UPDATE
          : PollType.TEXT

      const parsed =
        "update_config" in adminAction
          ? parseAdminActionUpdateConfig(adminAction.update_config)
          : {}

      return { type, ...parsed }
    }

    const parseAdminActionUpdateConfig = (config: GovConfig) => {
      const { effective_delay, voter_weight, owner } = config
      const { auth_admin_poll_config, default_poll_config } = config
      const { migration_poll_config } = config

      const configData =
        migration_poll_config || auth_admin_poll_config || default_poll_config

      const voting_period = configData?.voting_period
      const proposal_deposit = configData?.proposal_deposit
      const quorum = configData?.quorum
      const threshold = configData?.threshold

      return {
        contents: [
          ...parseContents({
            owner,
            voting_period: getBlocks(voting_period),
            effective_delay: getBlocks(effective_delay),
            proposal_deposit: proposal_deposit
              ? formatAsset(proposal_deposit, "MIR")
              : undefined,
            voter_weight,
          }),
          ...parseContents({ quorum, threshold }, { format: percent }),
        ],
      }
    }

    const parseWhitelist = ({ params, ...whitelist }: Whitelist) => {
      const { mint_period, pre_ipo_price, ...rest } = params
      const { oracle_proxy } = whitelist
      const provider = parseProxyAddress(oracle_proxy)

      return {
        contents: [
          ...parseContents({
            name: whitelist.name,
            symbol: whitelist.symbol,
            oracle_feeder: whitelist.oracle_feeder,
            oracle_provider: provider,
          }),
          ...parseContents(rest, { format: percent }),
          ...parseContents({ mint_period }, { unit: "Seconds" }),
          ...parseContents(
            { pre_ipo_price },
            { unit: `UST per ${whitelist.symbol}` }
          ),
        ],
      }
    }

    const parsePassCommandType = (passCommand: PassCommand) => {
      const { msg } = passCommand
      const decodedMsg: PassCommandMsg = fromBase64<PassCommandMsg>(msg)
      return "update_source_priority_list" in decodedMsg
        ? PollType.UPDATE_PRIORITY
        : "remove_source" in decodedMsg
        ? PollType.REMOVE_PRICE
        : "whitelist_proxy" in decodedMsg
        ? ViewOnlyPollType.WHITELIST_ORACLE
        : "update_asset"
        ? PollType.MINT_UPDATE
        : PollType.TEXT
    }

    const parseRevokeCollateral = ({ asset }: RevokeCollateral) => {
      const { symbol } = parseAssetInfo(asset)
      return { contents: parseContents({ asset: symbol }) }
    }

    const parseRevokeAsset = ({ asset_token, end_price }: RevokeAsset) => {
      const symbol = getSymbol(asset_token)
      return { contents: parseContents({ asset: symbol }) }
    }

    const parsePassCommand = ({ msg }: PassCommand) => {
      const decodedPassCommand = fromBase64<PassCommandMsg>(msg)

      return "update_asset" in decodedPassCommand
        ? parseUpdateAsset(decodedPassCommand.update_asset)
        : "update_source_priority_list" in decodedPassCommand
        ? parseUpdatePriorityList(
            decodedPassCommand.update_source_priority_list
          )
        : "remove_source" in decodedPassCommand
        ? parseRemovePrice(decodedPassCommand.remove_source)
        : "whitelist_proxy" in decodedPassCommand
        ? parseWhitelistProxy(decodedPassCommand.whitelist_proxy)
        : {}
    }

    const parseWhitelistProxy = (proxy: WhitelistProxy) => {
      const { proxy_addr, provider_name } = proxy
      return {
        contents: [
          ...parseContents({ proxy_address: proxy_addr }),
          ...parseContents({ oracle_provider: provider_name }),
        ],
      }
    }

    const parseUpdatePriorityList = (updatePriority: UpdatePriority) => {
      const { symbol, priority_list } = updatePriority
      const contents = priority_list
        .sort(([, prev], [, current]) => prev - current)
        .map(([addr]) => {
          const proxy = parseProxyAddress(addr)
          return { oracle_provider: proxy }
        })
      return {
        contents: [
          ...parseContents({ symbol }),
          ...contents.map((content) => parseContents(content)).flat(),
        ],
      }
    }

    const parseRemovePrice = (removeSource: RemovePrice) => {
      const { symbol, proxy_addr } = removeSource
      const proxy = parseProxyAddress(proxy_addr)
      return {
        contents: [...parseContents({ symbol, oracle_provider: proxy })],
      }
    }

    const parseProxyAddress = (address: string) => {
      const proxy =
        proxyWhitelist?.proxies.find((list) => list.address === address)
          ?.provider_name || address
      return proxy
    }

    const parseUpdateAsset = ({ asset_token, ...params }: UpdateAsset) => ({
      contents: [
        ...parseContents({ asset: getSymbol(asset_token) }),
        ...parseContents(params, { format: percent }),
      ],
    })

    const parseUpdateWeight = ({ asset_token, weight }: UpdateWeight) => ({
      contents: parseContents({
        asset: getSymbol(asset_token),
        weight: div(weight, 100),
      }),
    })

    const parseUpdateConfig = (
      config: Partial<GovConfig>,
      adminAction?: AdminAction
    ) => {
      const { effective_delay } = config
      const { voter_weight, owner } = config
      const poll_config = getConfig(config, adminAction)

      const voting_period = poll_config?.voting_period
      const proposal_deposit = poll_config?.proposal_deposit
      const quorum = poll_config?.quorum
      const threshold = poll_config?.threshold

      return {
        contents: [
          ...parseContents({
            owner,
            voting_period: getBlocks(voting_period),
            effective_delay: getBlocks(effective_delay),
            proposal_deposit: proposal_deposit
              ? formatAsset(proposal_deposit, "MIR")
              : undefined,
            voter_weight,
          }),
          ...parseContents({ quorum, threshold }, { format: percent }),
        ],
      }
    }

    const parseUpdateCollateralMultiplier = ({
      asset,
      multiplier,
    }: UpdateCollateralMultiplier) => {
      const { symbol } = parseAssetInfo(asset)
      return {
        contents: parseContents({ symbol, multiplier: String(multiplier) }),
      }
    }

    const getBlocks = (n?: number) => (isInteger(n) ? `${n} Blocks` : undefined)

    const parseSpend = ({ recipient, amount }: Spend) => ({
      contents: parseContents({
        recipient,
        amount: formatAsset(amount, "MIR"),
      }),
    })

    return (poll: PollData): Poll => {
      try {
        if (poll.execute_data) {
          const decoded = fromBase64<DecodedExecuteMsg>(poll.execute_data.msg)
          const parsed = parseParams(decoded, poll.id, poll.admin_action)
          return { ...poll, ...parsed }
        } else {
          const { admin_action } = poll
          if (!admin_action) return { ...poll, type: PollType.TEXT }

          const parsed = parseAdminAction(admin_action)
          return { ...poll, ...parsed }
        }
      } catch (error) {
        return poll
      }
    }
  },
})

export const useParsePoll = () => {
  return useRecoilValue(parsePollQuery)
}

/* helpers */
const parseContents = (
  object?: object,
  config?: { format?: (value: string) => string; unit?: string }
): Content[] =>
  !object
    ? []
    : Object.entries(object).reduce<Content[]>((acc, [title, content]) => {
        const formatted = config?.format?.(content) ?? content
        const next = {
          title: getTitle(title),
          content: [formatted, config?.unit ?? ""].join(" "),
        }

        return content ? [...acc, next] : acc
      }, [])

export const getTitle = (title: string) => title.replace(/_/g, " ")

export const getConfig = (
  config: Partial<GovConfig> | GovConfig,
  adminAction?: AdminAction
) => {
  if (!config) return

  const { default_poll_config } = config
  const { auth_admin_poll_config } = config
  const { migration_poll_config } = config

  const poll_config = adminAction
    ? "execute_migrations" in adminAction
      ? migration_poll_config
      : "authorize_claim" in adminAction || "update_config" in adminAction
      ? auth_admin_poll_config
      : default_poll_config
    : default_poll_config

  return poll_config
}

export const parseExecuteData = (obj: ExecuteData) => {
  const data = fromBase64<{ pass_command: ExecuteData } | object>(obj.msg)
  const parse = {
    ...obj,
    msg:
      "pass_command" in data
        ? {
            pass_command: {
              ...data.pass_command,
              msg: fromBase64(data.pass_command.msg),
            },
          }
        : data,
  }

  return parse
}
