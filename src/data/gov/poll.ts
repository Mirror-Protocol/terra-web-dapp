import { selectorFamily, useRecoilValue } from "recoil"
import { Content } from "../../components/componentTypes"
import { protocolQuery } from "../contract/protocol"
import { getContractQueryQuery } from "../utils/query"
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
  staked_amount?: string

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

export const govPollQuery = selectorFamily({
  key: "govPoll",
  get:
    (id: number) =>
    async ({ get }) => {
      const { contracts } = get(protocolQuery)
      const getContractQuery = get(getContractQueryQuery)
      return await getContractQuery<PollData>(
        {
          contract: contracts["gov"],
          msg: { poll: { poll_id: id } },
        },
        "govPoll"
      )
    },
})

export const usePoll = (id: number) => {
  const poll = useRecoilValue(govPollQuery(id))
  const parsePoll = useParsePoll()
  return poll && parsePoll(poll)
}
