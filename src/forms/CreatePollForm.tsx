import { useEffect, useState } from "react"
import { useQuery } from "react-query"
import { useRecoilValueLoadable } from "recoil"
import { useLCDClient } from "@terra-money/wallet-provider"
import { AccAddress } from "@terra-money/terra.js"

import useNewContractMsg from "../libs/useNewContractMsg"
import Tooltips from "../lang/Tooltips"
import { MAX_MSG_LENGTH } from "../constants"
import { div, gte, number, times } from "../libs/math"
import { record, getLength } from "../libs/utils"
import { lookup, toAmount } from "../libs/parse"
import useForm, { Values } from "../libs/useForm"
import { validate as v, step, toBase64, placeholder } from "../libs/formHelpers"
import { renderBalance } from "../libs/formHelpers"
import { useProtocol } from "../data/contract/protocol"
import { multipliersQuery } from "../data/contract/normalize"
import { useFindBalance } from "../data/contract/normalize"
import { useGovConfig } from "../data/gov/config"
import { communityConfigQuery } from "../data/contract/info"
import { getDistributionWeightQuery } from "../data/contract/info"
import { mintAssetConfigQuery } from "../data/contract/contract"
import { ProxyItem } from "../data/contract/proxy"

import { TooltipIcon } from "../components/Tooltip"
import FormGroup from "../components/FormGroup"
import Formatted from "../components/Formatted"
import { PollType } from "../pages/Poll/CreatePoll"
import useGovReceipt from "./receipts/useGovReceipt"
import useSelectAsset, { Config } from "./modules/useSelectAsset"
import FormContainer from "./modules/FormContainer"
import Sortable from "./modules/Sortable"
import styles from "./CreatePollForm.module.scss"

enum Key {
  title = "title",
  description = "description",
  link = "link",

  /* Type.TEXT_WHITELIST */
  name = "name",
  ticker = "ticker",
  listed = "listed",
  suggestedOracle = "suggestedOracle",

  /* Type.WHITELIST */
  reference = "reference",
  oracle = "oracle",
  weight = "weight",
  auctionDiscount = "auctionDiscount",
  minCollateralRatio = "minCollateralRatio",
  // Pre-IPO
  mintPeriod = "mintPeriod",
  minCollateralRatioAfterIPO = "minCollateralRatioAfterIPO",
  price = "price",

  /* Type.MINT_UPDATE */
  asset = "asset",

  /* Type.GOV_UPDATE */
  owner = "owner",
  quorum = "quorum",
  threshold = "threshold",
  votingPeriod = "votingPeriod",
  effectiveDelay = "effectiveDelay",
  proposalDeposit = "proposalDeposit",
  voterWeight = "voterWeight",

  /* Type.COLLATERAL */
  multiplier = "multiplier",

  /* Type.COMMUNITY_SPEND */
  recipient = "recipient",
  amount = "amount",
}

interface Props {
  type: PollType
  headings: { title: string; desc: string }
}

const CreatePollForm = ({ type, headings }: Props) => {
  /* context */
  const { contracts, getToken, toAssetInfo, parseAssetInfo } = useProtocol()
  const { contents: findBalance } = useFindBalance()
  const config = useGovConfig()
  const communityConfig = useRecoilValueLoadable(communityConfigQuery)
  const mintAssetConfig = useRecoilValueLoadable(mintAssetConfigQuery)
  const multipliers = useRecoilValueLoadable(multipliersQuery)
  const getDistributionWeight = useRecoilValueLoadable(
    getDistributionWeightQuery
  )

  const { mirrorToken, mint, collateralOracle } = contracts
  const { factory, community, gov, oracleHub } = contracts

  const spend_limit =
    communityConfig.state === "hasValue"
      ? communityConfig.contents?.spend_limit
      : undefined

  const getMintAssetConfig = (token: string) =>
    mintAssetConfig.state === "hasValue"
      ? mintAssetConfig.contents?.[token]
      : undefined

  const getMultiplier = (token: string) =>
    multipliers.state === "hasValue" ? multipliers.contents?.[token] : undefined

  const getWeight = (token: string) =>
    getDistributionWeight.state === "hasValue"
      ? getDistributionWeight.contents(token)
      : undefined

  const getFieldKeys = () => {
    // Determine here which key to use for each type.
    // Filter out the validation and the fields to be printed on the screen based on this.

    const defaultKeys = [Key.title, Key.description, Key.link]
    const additionalKeys: Record<PollType, Key[]> = {
      [PollType.TEXT]: defaultKeys,
      [PollType.TEXT_WHITELIST]: [
        Key.name,
        Key.ticker,
        Key.listed,
        Key.description,
        Key.link,
        Key.suggestedOracle,
      ],
      [PollType.TEXT_PREIPO]: [
        Key.name,
        Key.ticker,
        Key.listed,
        Key.description,
        Key.link,
        Key.suggestedOracle,
      ],
      [PollType.WHITELIST]: [
        ...defaultKeys,
        Key.name,
        Key.ticker,
        Key.oracle,
        Key.reference,
        Key.auctionDiscount,
        Key.minCollateralRatio,
      ],
      [PollType.PREIPO]: [
        ...defaultKeys,
        Key.name,
        Key.ticker,
        Key.oracle,
        Key.reference,
        Key.auctionDiscount,
        Key.minCollateralRatio,
        Key.mintPeriod,
        Key.minCollateralRatioAfterIPO,
        Key.price,
      ],
      [PollType.DELIST_COLLATERAL]: [...defaultKeys, Key.asset],
      [PollType.DELIST_ASSET]: [...defaultKeys, Key.asset],
      [PollType.INFLATION]: [...defaultKeys, Key.asset, Key.weight],
      [PollType.MINT_UPDATE]: [
        ...defaultKeys,
        Key.asset,
        Key.auctionDiscount,
        Key.minCollateralRatio,
      ],
      [PollType.GOV_PARAM_UPDATE]: [
        ...defaultKeys,
        Key.effectiveDelay,
        Key.voterWeight,
      ],
      [PollType.POLL_PARAM_UPDATE]: [
        ...defaultKeys,
        Key.quorum,
        Key.threshold,
        Key.votingPeriod,
        Key.proposalDeposit,
      ],
      [PollType.COLLATERAL]: [
        ...defaultKeys,
        Key.asset,
        Key.multiplier,
        Key.oracle,
      ],
      [PollType.COMMUNITY_SPEND]: [...defaultKeys, Key.recipient, Key.amount],
      [PollType.UPDATE_PRIORITY]: [...defaultKeys, Key.asset],
      [PollType.REMOVE_PRICE]: [...defaultKeys, Key.asset, Key.oracle],
    }

    return additionalKeys[type]
  }

  const combineTitle = ({ title, name, ticker }: Values<Key>) =>
    type === PollType.TEXT_WHITELIST
      ? `[Whitelist] ${name} (${ticker})`
      : type === PollType.TEXT_PREIPO
      ? `[Pre-IPO] ${name} (${ticker})`
      : title

  const combineDescription = ({ description, ...values }: Values<Key>) => {
    const { listed, suggestedOracle, reference } = values

    const combined = [
      description,
      listed && `Listed Exchange: ${listed}`,
      suggestedOracle && `Suggested Oracle: ${suggestedOracle}`,
      reference && `Reference Poll ID: ${reference}`,
    ]

    return combined.filter(Boolean).join("\n")
  }

  /* form:validate */
  const validate = (values: Values<Key>) => {
    const { title, description, link } = values
    const { name, ticker, oracle, asset } = values
    const { weight, auctionDiscount, minCollateralRatio } = values
    const { mintPeriod, minCollateralRatioAfterIPO, price } = values
    const { owner, quorum, threshold, votingPeriod } = values
    const { effectiveDelay, proposalDeposit } = values
    const { voterWeight, multiplier, recipient, amount } = values
    const { listed, reference } = values

    const paramRange = {
      optional: [
        PollType.MINT_UPDATE,
        PollType.POLL_PARAM_UPDATE,
        PollType.GOV_PARAM_UPDATE,
      ].includes(type),
      max: "100",
    }

    const textRanges = {
      [Key.title]: { min: 4, max: 64 },
      [Key.description]: { min: 4, max: 256 },
      [Key.link]: { min: 12, max: 128 },
      [Key.name]: { min: 3, max: 50 },
      [Key.ticker]: { min: 1, max: 11 },
    }

    return record(
      {
        [Key.title]: [PollType.TEXT_WHITELIST, PollType.TEXT_PREIPO].includes(
          type
        )
          ? ""
          : v.required(title) ||
            v.length(title, textRanges[Key.title], "Title"),
        [Key.description]:
          v.required(description) ||
          v.length(description, textRanges[Key.description], "Description"),
        [Key.link]: !link
          ? ""
          : v.length(link, textRanges[Key.link], "Link") || v.url(link),

        // Type.TEXT_WHITELIST
        [Key.name]:
          v.required(name) || v.length(name, textRanges[Key.name], "Name"),
        [Key.ticker]:
          v.required(ticker) ||
          v.length(ticker, textRanges[Key.ticker], "Ticker") ||
          v.symbol(ticker),
        [Key.listed]: v.required(listed),
        [Key.suggestedOracle]: "",

        // Type.WHITELIST
        [Key.reference]: !reference
          ? ""
          : v.integer(reference, "Reference Poll ID"),
        [Key.oracle]: v.address(oracle),

        // Type.MINT_UPDATE
        [Key.asset]: v.required(asset),

        [Key.weight]: v.amount(weight, {}, "Weight"),
        [Key.auctionDiscount]: v.amount(
          auctionDiscount,
          paramRange,
          "Auction discount"
        ),
        [Key.minCollateralRatio]: v.amount(
          minCollateralRatio,
          { ...paramRange, max: undefined },
          "Minimum collateral ratio"
        ),
        [Key.mintPeriod]: v.integer(mintPeriod, "Mint period"),
        [Key.minCollateralRatioAfterIPO]: v.amount(
          minCollateralRatioAfterIPO,
          { ...paramRange, max: undefined },
          "Min collateral ratio after IPO"
        ),
        [Key.price]: v.amount(
          price,
          { ...paramRange, max: undefined },
          "Price"
        ),

        // Type.GOV_UPDATE
        [Key.owner]: !owner ? "" : v.address(owner),
        [Key.quorum]: !quorum ? "" : v.amount(quorum, paramRange, "Quorum"),
        [Key.threshold]: !threshold
          ? ""
          : v.amount(threshold, paramRange, "Threshold"),
        [Key.votingPeriod]: !votingPeriod
          ? ""
          : v.integer(votingPeriod, "Voting Period"),
        [Key.effectiveDelay]: !effectiveDelay
          ? ""
          : v.integer(effectiveDelay, "Effective Delay"),
        [Key.proposalDeposit]: !proposalDeposit
          ? ""
          : v.amount(proposalDeposit, { symbol: "MIR" }),
        [Key.voterWeight]: !voterWeight
          ? ""
          : v.amount(voterWeight, {}, "Weight"),

        // Type.COLLATERAL
        [Key.multiplier]: !multiplier
          ? ""
          : v.amount(multiplier, { dp: 6 }, "Weight"),

        // Type.COMMUNITY_SPEND
        [Key.recipient]: v.address(recipient),
        [Key.amount]: v.amount(amount, { symbol: "MIR" }),
      },
      "",
      getFieldKeys()
    )
  }

  /* form:hook */
  const initial = Object.assign(record(Key, ""))

  const form = useForm<Key>(initial, validate)
  const { values, setValue, getFields, attrs, invalid } = form

  const title = combineTitle(values)
  const description = combineDescription(values)

  const { link } = values
  const { name, ticker, oracle, asset } = values
  const { weight, auctionDiscount, minCollateralRatio } = values
  const { mintPeriod, minCollateralRatioAfterIPO, price } = values
  const { owner, quorum, threshold, votingPeriod } = values
  const { effectiveDelay, proposalDeposit } = values
  const { voterWeight, multiplier, recipient, amount } = values

  const deposit =
    type === PollType.GOV_PARAM_UPDATE || type === PollType.POLL_PARAM_UPDATE
      ? config?.auth_admin_poll_config.proposal_deposit ?? "0"
      : config?.default_poll_config.proposal_deposit ?? "0"

  /* query: oracle feeder */
  const lcd = useLCDClient()

  type PriceItem = [
    number,
    { address: AccAddress; provider_name: string },
    { success: { last_updated: number; rate: string } }
  ]

  const { data: proxiedList, ...proxiedListState } = useQuery(
    ["ProxyWhitelist", ticker, asset],
    async () => {
      if (ticker) {
        const { proxies } = await lcd.wasm.contractQuery<{
          proxies: ProxyItem[]
        }>(oracleHub, { proxy_whitelist: {} })

        const checkSource = async (proxy_addr: AccAddress) =>
          await lcd.wasm.contractQuery<Rate>(oracleHub, {
            check_source: { proxy_addr, symbol: ticker },
          })

        const checkSourceResponses = await Promise.allSettled(
          proxies.map(({ address }) => checkSource(address))
        )

        const sources = checkSourceResponses.map((result) => {
          if (result.status === "rejected") return false
          return true
        })

        return proxies.filter((_, index) => sources[index])
      } else {
        const data = await lcd.wasm.contractQuery<{ price_list: PriceItem[] }>(
          oracleHub,
          { price_list: { asset_token: asset } }
        )

        return data.price_list.map(([, proxy]) => proxy)
      }
    },
    { enabled: !!(ticker || asset), retry: false }
  )

  const proxiedItem = proxiedList?.length === 1 ? proxiedList[0] : undefined

  useEffect(() => {
    if (proxiedItem) setValue(Key.oracle, proxiedItem.address)
  }, [proxiedItem, setValue])

  useEffect(() => {
    if (proxiedList) setPriorityList(proxiedList)
  }, [proxiedList, setValue])

  /* render:form */
  const isCollateral =
    type === PollType.COLLATERAL || type === PollType.DELIST_COLLATERAL

  const selectAssetConfig: Config = {
    token: asset,
    onSelect: (value) => setValue(Key.asset, value),
    validate: isCollateral ? undefined : ({ symbol }) => symbol !== "MIR",
    native: isCollateral ? ["uluna"] : undefined,
    showExternal: isCollateral,
  }

  const select = useSelectAsset(selectAssetConfig)

  const weightPlaceholders = {
    [Key.weight]: div(getWeight(asset), 100),
  }

  const assetConfig = getMintAssetConfig(asset)
  const mintPlaceholders = {
    [Key.auctionDiscount]: assetConfig
      ? times(assetConfig.auction_discount, 100)
      : "20",
    [Key.minCollateralRatio]: assetConfig
      ? times(assetConfig.min_collateral_ratio, 100)
      : "150",
    [Key.mintPeriod]: "",
    [Key.minCollateralRatioAfterIPO]: "150",
    [Key.price]: "",
  }

  const configPlaceholders = {
    [Key.owner]: config?.owner ?? "",
    [Key.quorum]: times(config?.default_poll_config.quorum, 100),
    [Key.threshold]: times(config?.default_poll_config.threshold, 100),
    [Key.votingPeriod]: String(config?.default_poll_config.voting_period) ?? "",
    [Key.effectiveDelay]: String(config?.effective_delay) ?? "",
    [Key.proposalDeposit]:
      lookup(config?.default_poll_config.proposal_deposit, "MIR") ?? "",
    [Key.voterWeight]: config?.voter_weight ?? "",
  }

  const renderPriceItemOption = ({ address, provider_name }: ProxyItem) => (
    <option value={address} key={address}>
      {provider_name}
    </option>
  )

  const fieldKeys = getFieldKeys()
  const fields = {
    deposit: {
      help: renderBalance(findBalance(getToken("MIR")), "MIR"),
      label: <TooltipIcon content={Tooltips.Gov.Deposit}>Deposit</TooltipIcon>,
      value: <Formatted symbol="MIR">{deposit}</Formatted>,
    },

    ...getFields({
      [Key.title]: {
        label: "Title",
        input: { placeholder: "", autoFocus: true },
      },
      [Key.description]: {
        label: "Description",
        textarea: { placeholder: "" },
      },
      [Key.link]: {
        label: "Information Link (Optional)",
        input: {
          placeholder: [
            PollType.TEXT_WHITELIST,
            PollType.TEXT_PREIPO,
            PollType.WHITELIST,
            PollType.PREIPO,
          ].includes(type)
            ? "URL for additional asset information (Bloomberg, Investing.com, Yahoo Finance, etc.)"
            : "URL for additional information",
        },
      },

      // Type.TEXT_WHITELIST
      [Key.name]: {
        label: "Asset Name",
        input: {
          placeholder: "Apple Inc.",
          autoFocus: [PollType.TEXT_WHITELIST, PollType.TEXT_PREIPO].includes(
            type
          ),
        },
      },
      [Key.ticker]: {
        label: <TooltipIcon content={Tooltips.Gov.Ticker}>Ticker</TooltipIcon>,
        input: { placeholder: "AAPL" },
      },
      [Key.listed]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.ListedExchange}>
            Listed Exchange
          </TooltipIcon>
        ),
        input: { placeholder: "NASDAQ" },
      },
      [Key.suggestedOracle]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.SuggestedOracle}>
            Suggested Oracle (Optional)
          </TooltipIcon>
        ),
        input: { placeholder: "Band Protocol" },
      },

      // Type.WHITELIST
      [Key.oracle]: {
        label: "Oracle Privider",
        value:
          fieldKeys.includes(Key.ticker) && !ticker
            ? "Enter ticker to find options"
            : fieldKeys.includes(Key.asset) && !asset
            ? "Select asset to find options"
            : proxiedListState.error || (proxiedList && !proxiedList.length)
            ? "No available price"
            : proxiedListState.isLoading
            ? "Loading..."
            : proxiedItem
            ? proxiedItem.provider_name
            : undefined,
        select:
          proxiedList && proxiedList.length > 1 ? (
            <select
              value={oracle}
              onChange={(e) => setValue(Key.oracle, e.target.value)}
              style={{ width: "100%" }}
            >
              {proxiedList.map(renderPriceItemOption)}
            </select>
          ) : undefined,
      },
      [Key.reference]: {
        label: "Reference Poll ID (Optional)",
        input: { placeholder: "" },
      },

      // Type.INFLATION
      [Key.weight]: {
        label: <TooltipIcon content={Tooltips.Gov.Weight}>Weight</TooltipIcon>,
        input: {
          type: "number",
          step: step(),
          placeholder: weightPlaceholders[Key.weight],
        },
      },

      // Type.MINT_UPDATE
      [Key.asset]: {
        label: "Asset",
        select: select.button,
        assets: select.assets,
        focused: select.isOpen,
      },
      [Key.auctionDiscount]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.AuctionDiscount}>
            Auction Discount
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: mintPlaceholders[Key.auctionDiscount],
        },
        unit: "%",
      },
      [Key.minCollateralRatio]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.MinimumCollateralRatio}>
            Minimum Collateral Ratio before IPO
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: mintPlaceholders[Key.minCollateralRatio],
        },
        unit: "%",
      },
      [Key.mintPeriod]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.MintPeriod}>
            Mint Period
          </TooltipIcon>
        ),
        input: { placeholder: mintPlaceholders[Key.mintPeriod] },
        unit: "Second(s)",
        unitAfterValue: true,
      },
      [Key.minCollateralRatioAfterIPO]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.MinimumCollateralRatioAfterIPO}>
            Minimum collateral ratio after IPO
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: mintPlaceholders[Key.minCollateralRatioAfterIPO],
        },
        unit: "%",
      },
      [Key.price]: {
        label:
          type === PollType.PREIPO ? (
            <TooltipIcon content={Tooltips.Gov.PreIpoPrice}>
              Pre-IPO Price
            </TooltipIcon>
          ) : (
            "End Price"
          ),
        input: {
          type: "number",
          step: step(),
          placeholder: mintPlaceholders[Key.price],
        },
        unit: ticker ? `UST per ${ticker}` : "",
        unitAfterValue: true,
      },

      // Type.GOV-PARAM-UPDATE, Type.POLL-PARAM-UPDATE
      [Key.owner]: {
        label: "Owner (Optional)",
        input: { placeholder: configPlaceholders[Key.owner] },
      },
      [Key.quorum]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.Quorum}>
            Quorum (Optional)
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: configPlaceholders[Key.quorum],
        },
        unit: "%",
      },
      [Key.threshold]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.Threshold}>
            Threshold (Optional)
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: configPlaceholders[Key.threshold],
        },
        unit: "%",
      },
      [Key.votingPeriod]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.VotingPeriod}>
            Voting Period (Optional)
          </TooltipIcon>
        ),
        input: { placeholder: configPlaceholders[Key.votingPeriod] },
        unit: "Second(s)",
        unitAfterValue: true,
      },
      [Key.effectiveDelay]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.EffectiveDelay}>
            Effective Delay (Optional)
          </TooltipIcon>
        ),
        input: { placeholder: configPlaceholders[Key.effectiveDelay] },
        unit: "Second(s)",
        unitAfterValue: true,
      },
      [Key.proposalDeposit]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.ProposalDeposit}>
            Proposal Deposit (Optional)
          </TooltipIcon>
        ),
        input: { placeholder: configPlaceholders[Key.proposalDeposit] },
        unit: "MIR",
        unitAfterValue: true,
      },
      [Key.voterWeight]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.VoterWeight}>
            Voter weight (Optional)
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: configPlaceholders[Key.voterWeight],
        },
      },

      // Type.COLLATERAL
      [Key.multiplier]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.Multiplier}>
            Multiplier
          </TooltipIcon>
        ),
        input: {
          type: "number",
          step: step(),
          placeholder: getMultiplier(asset),
        },
      },

      // Type.COMMUNITY_SPEND
      [Key.recipient]: {
        label: (
          <TooltipIcon content={Tooltips.Gov.Recipient}>Recipient</TooltipIcon>
        ),
        input: { placeholder: "Terra address" },
      },
      [Key.amount]: {
        label: <TooltipIcon content={Tooltips.Gov.Amount}>Amount</TooltipIcon>,
        input: { placeholder: placeholder("MIR") },
        help: renderBalance(spend_limit, "MIR"),
        unit: "MIR",
        unitAfterValue: true,
      },
    }),
  }

  /* submit */
  const newContractMsg = useNewContractMsg()
  const token = asset

  /* Type.WHITELIST */
  const whitelistMessage = {
    name,
    symbol: ticker,
    oracle_proxy: oracle,
    params: {
      auction_discount: div(auctionDiscount, 100),
      min_collateral_ratio: div(minCollateralRatio, 100),
      mint_period: mintPeriod ? number(mintPeriod) : undefined,
      min_collateral_ratio_after_ipo: minCollateralRatioAfterIPO
        ? div(minCollateralRatioAfterIPO, 100)
        : undefined,
      pre_ipo_price: price || undefined,
    },
  }

  /* Type.DELIST */
  const revokeCollateral = {
    asset: toAssetInfo(asset),
  }

  const revokeAsset = {
    asset_token: asset,
  }

  /* Type.INFLATION */
  const updateWeight = {
    asset_token: token,
    weight: weight ? number(times(weight, 100)) : undefined,
  }

  /* Type.MINT_UPDATE */
  const mintPassCommand = {
    contract_addr: mint,
    msg: toBase64({
      update_asset: {
        asset_token: token,
        auction_discount: auctionDiscount
          ? div(auctionDiscount, 100)
          : undefined,
        min_collateral_ratio: minCollateralRatio
          ? div(minCollateralRatio, 100)
          : undefined,
      },
    }),
  }

  /* Type.GOV_PARAM_UPDATE */
  const govParamUpdateConfig = {
    owner,
    effective_delay: effectiveDelay ? Number(effectiveDelay) : undefined,
    voter_weight: voterWeight || undefined,
  }

  /* Type.POLL_PARAM_UPDATE */
  const pollParamUpdateConfig = {
    owner,
    default_poll_config: {
      proposal_deposit: proposalDeposit
        ? toAmount(proposalDeposit)
        : config?.default_poll_config.proposal_deposit,
      voting_period: votingPeriod
        ? Number(votingPeriod)
        : config?.default_poll_config.voting_period,
      quorum: quorum ? div(quorum, 100) : config?.default_poll_config.quorum,
      threshold: threshold
        ? div(threshold, 100)
        : config?.default_poll_config.threshold,
    },
    migration_poll_config: null,
    auth_admin_poll_config: null,
  }

  /* Type.COLLATERL */
  const updateCollateralMultiplier = {
    asset: toAssetInfo(asset),
    multiplier: multiplier || undefined,
  }

  /* Type.COMMUNITY_SPEND */
  const communitySpend = {
    recipient,
    amount: toAmount(amount),
  }

  const assetInfo = toAssetInfo(token)
  const { symbol } = parseAssetInfo(assetInfo)

  /* Type.UPDATE_PRIORITY */
  const [priorityList, setPriorityList] = useState<ProxyItem[]>()

  const updateSourcePriorityList = {
    symbol: symbol.slice(1),
    priority_list: priorityList?.map(({ address }, index) => [
      address,
      (index + 1) * 10,
    ]),
  }

  const updatePriorityPassCommand = {
    contract_addr: oracleHub,
    msg: toBase64({ update_source_priority_list: updateSourcePriorityList }),
  }

  /* Type.REMOVE_PRICE */
  const removeSource = {
    symbol: symbol.slice(1),
    proxy_addr: oracle,
  }

  const removePricePassCommand = {
    contract_addr: oracleHub,
    msg: toBase64({ remove_source: removeSource }),
  }

  const admin_action = {
    [PollType.GOV_PARAM_UPDATE]: { update_config: govParamUpdateConfig },
    [PollType.POLL_PARAM_UPDATE]: { update_config: pollParamUpdateConfig },
    [PollType.TEXT]: undefined,
    [PollType.TEXT_WHITELIST]: undefined,
    [PollType.TEXT_PREIPO]: undefined,
    [PollType.PREIPO]: undefined,
    [PollType.WHITELIST]: undefined,
    [PollType.DELIST_ASSET]: undefined,
    [PollType.DELIST_COLLATERAL]: undefined,
    [PollType.COMMUNITY_SPEND]: undefined,
    [PollType.MINT_UPDATE]: undefined,
    [PollType.COLLATERAL]: undefined,
    [PollType.UPDATE_PRIORITY]: undefined,
    [PollType.REMOVE_PRICE]: undefined,
    [PollType.INFLATION]: undefined,
  }[type]

  const execute_msg = {
    [PollType.TEXT]: undefined,
    [PollType.TEXT_WHITELIST]: undefined,
    [PollType.TEXT_PREIPO]: undefined,
    [PollType.GOV_PARAM_UPDATE]: undefined,
    [PollType.POLL_PARAM_UPDATE]: undefined,
    [PollType.WHITELIST]: {
      contract: factory,
      msg: toBase64({ whitelist: whitelistMessage }),
    },
    [PollType.PREIPO]: {
      contract: factory,
      msg: toBase64({ whitelist: whitelistMessage }),
    },
    [PollType.DELIST_COLLATERAL]: {
      contract: collateralOracle,
      msg: toBase64({ revoke_collateral_asset: revokeCollateral }),
    },
    [PollType.DELIST_ASSET]: {
      contract: factory,
      msg: toBase64({ revoke_asset: revokeAsset }),
    },
    [PollType.INFLATION]: {
      contract: factory,
      msg: toBase64({ update_weight: updateWeight }),
    },
    [PollType.MINT_UPDATE]: {
      contract: factory,
      msg: toBase64({ pass_command: mintPassCommand }),
    },
    [PollType.COLLATERAL]: {
      contract: collateralOracle,
      msg: toBase64({
        update_collateral_multiplier: updateCollateralMultiplier,
      }),
    },
    [PollType.COMMUNITY_SPEND]: {
      contract: community,
      msg: toBase64({ spend: communitySpend }),
    },
    [PollType.UPDATE_PRIORITY]: {
      contract: factory,
      msg: toBase64({
        pass_command: updatePriorityPassCommand,
      }),
    },
    [PollType.REMOVE_PRICE]: {
      contract: factory,
      msg: toBase64({
        pass_command: removePricePassCommand,
      }),
    },
  }[type]

  const msg = toBase64({
    create_poll: { title, description, link, execute_msg, admin_action },
  })

  const data = [
    newContractMsg(mirrorToken, {
      send: { amount: deposit, contract: gov, msg },
    }),
  ]

  const messages = !gte(findBalance(getToken("MIR")), deposit)
    ? ["Insufficient balance"]
    : getLength(msg) > MAX_MSG_LENGTH
    ? ["Input is too long to be executed"]
    : type === PollType.GOV_PARAM_UPDATE &&
      Object.values(govParamUpdateConfig).filter(Boolean).length > 1
    ? ["Only one governance parameter can be modified at a time."]
    : type === PollType.UPDATE_PRIORITY && proxiedItem
    ? ["There is only one price source"]
    : type === PollType.REMOVE_PRICE && proxiedItem
    ? ["Cannot remove the only price source"]
    : undefined

  const disabled = invalid || !!messages?.length

  /* result */
  const label = "Submit"
  const parseTx = useGovReceipt()
  const container = { attrs, contents: [], messages, label, disabled, data }

  return (
    <FormContainer {...container} parseTx={parseTx} gov>
      <header className={styles.headings}>
        <h1 className={styles.title}>{headings.title}</h1>
        <p className={styles.desc}>{headings.desc}</p>
      </header>

      {fieldKeys.map(
        (key) =>
          !fields[key].input?.disabled && (
            <FormGroup {...fields[key]} type={2} textAlign="left" key={key} />
          )
      )}

      {type === PollType.UPDATE_PRIORITY && priorityList && (
        <FormGroup label="Priority" type={2} textAlign="left">
          <Sortable
            list={priorityList.map(({ address, provider_name }) => ({
              id: address,
              content: provider_name,
            }))}
            callback={(list) =>
              setPriorityList(
                list.map(({ id: address, content: provider_name }) => ({
                  address,
                  provider_name,
                }))
              )
            }
          />
        </FormGroup>
      )}

      <FormGroup {...fields["deposit"]} type={2} textAlign="left" />
    </FormContainer>
  )
}

export default CreatePollForm
