import { Switch, Route, RouteProps, Redirect } from "react-router-dom"

/* Menu */
import My from "./pages/My/My"
import Trade from "./pages/Trade/Trade"
import Borrow from "./pages/Borrow/Borrow"
import Farm from "./pages/Farm/Farm"
import Gov from "./pages/Gov/Gov"

/* Txs */
import Send from "./pages/Txs/Send"
import Mint from "./pages/Mint/Mint"
import Stake from "./pages/Stake/Stake"
import ClaimRewards from "./pages/Txs/ClaimRewards"
import ClaimUST from "./pages/Txs/ClaimUST"
import LimitOrder from "./pages/Txs/LimitOrder" // Cancel limit order

/* Informations */
import Info from "./pages/Info"
import Tool from "./pages/Tools/Tool"
import Data from "./pages/Tools/Data"
import Auth from "./pages/Auth"
import Receipt from "./pages/Tools/Receipt"
import Caution from "./forms/modules/Caution"

export enum MenuKey {
  MY = "My Page",
  TRADE = "Trade",
  BORROW = "Borrow",
  FARM = "Farm",
  GOV = "Govern",

  SEND = "Send",
  MINT = "Mint",
  STAKE = "Stake",
  CLAIMREWARDS = "Claim Rewards",
  CLAIMUST = "Claim UST",
  LIMIT = "Limit order",
}

export const menu: Dictionary<RouteProps> = {
  [MenuKey.MY]: { path: "/my", component: My },
  [MenuKey.TRADE]: { path: "/trade", component: Trade },
  [MenuKey.BORROW]: { path: "/borrow", component: Borrow },
  [MenuKey.FARM]: { path: "/farm", component: Farm },
  [MenuKey.GOV]: { path: "/gov", component: Gov },

  [MenuKey.SEND]: { path: "/send", component: Send },
  [MenuKey.MINT]: { path: "/mint", component: Mint },
  [MenuKey.STAKE]: { path: "/stake", component: Stake },
  [MenuKey.CLAIMREWARDS]: { path: "/claim/rewards", component: ClaimRewards },
  [MenuKey.CLAIMUST]: { path: "/claim/ust", component: ClaimUST },
  [MenuKey.LIMIT]: { path: "/limit", component: LimitOrder },

  info: { path: "/info", component: Info },
  tool: { path: "/tool", component: Tool },
  data: { path: "/data", component: Data },
  auth: { path: "/auth", component: Auth },
  receipt: { path: "/receipt", component: Receipt },
  caution: { path: "/caution", component: Caution },
}

export const getPath = (key: MenuKey) => menu[key].path as string

export default (routes: Dictionary<RouteProps> = menu, path: string = "") => (
  <Switch>
    {Object.entries(routes).map(([key, route]) => (
      <Route {...route} path={path + route.path} key={key} />
    ))}

    <Redirect to="/trade" />
  </Switch>
)
