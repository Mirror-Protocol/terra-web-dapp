import { useQuery } from "react-query"
import { useLCDClient } from "@terra-money/wallet-provider"
import { Content } from "../../components/componentTypes"
import { useProtocolAddress } from "../contract/protocol"
import { useParsePoll } from "./parse"

type Migrations = [[string, number, string]]

interface ExecuteMigrations {
  execute_migrations: {
    migrations: Migrations
  }
}

interface AuthorizeClaim {
  authorize_claim: {
    authorized_addr: string
  }
}

interface UpdateConfig {
  update_config: GovConfig
}

export type AdminAction = ExecuteMigrations | AuthorizeClaim | UpdateConfig

export interface ExecuteData {
  contract: string
  msg: EncodedExecuteMsg
}

export interface PollData {
  id: number
  end_time: number
  status: PollStatus
  creator: string

  admin_action?: AdminAction

  deposit_amount: string

  yes_votes?: string
  no_votes?: string
  abstain_votes?: string
  total_balance_at_end_poll?: string
  voters_reward?: string

  title: string
  description: string
  link?: string

  execute_data: ExecuteData
}

export enum PollStatus {
  InProgress = "in_progress",
  Passed = "passed",
  Rejected = "rejected",
  Executed = "executed",
}

export interface Poll extends PollData {
  type?: string
  msg?: object
  params?: object
  contents?: Content[]
}

export const usePoll = (id: number) => {
  const lcd = useLCDClient()
  const { data: protocolAddress } = useProtocolAddress()
  const contracts = protocolAddress?.contracts ?? {}
  const parsePoll = useParsePoll()

  return useQuery(["govPoll", lcd.config, contracts, id], async () => {
    const poll = await lcd.wasm.contractQuery<PollData>(contracts["gov"], {
      poll: { poll_id: id },
    })
    return parsePoll(poll)
  })
}
