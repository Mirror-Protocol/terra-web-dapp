import Tooltips from "../../lang/Tooltips"
import { gt } from "../../libs/math"
import { formatAsset } from "../../libs/parse"
import getLpName from "../../libs/getLpName"
import { useProtocol } from "../../data/contract/protocol"
import { useMyFarming } from "../../data/my/farming"
import { getPath, MenuKey } from "../../routes"

import Table from "../../components/Table"
import Caption from "../../components/Caption"
import { TooltipIcon } from "../../components/Tooltip"
import Delisted from "../../components/Delisted"
import LinkButton from "../../components/LinkButton"
import Formatted from "../../components/Formatted"
import Percent from "../../components/Percent"
import { StakeType } from "../../types/Types"
import CaptionData from "./CaptionData"

const Farming = () => {
  const { getSymbol } = useProtocol()
  const { dataSource, totalRewards, totalAstroTokenReward, totalRewardsValue } =
    useMyFarming()

  const dataExists = !!dataSource.length
  const description = dataExists && (
    <CaptionData
      list={[
        {
          title: "Reward",
          content: (
            <>
              {formatAsset(totalRewards, "MIR")}{" "}
              <span className="muted">
                ≈ {formatAsset(totalRewardsValue, "uusd")}
              </span>
              {gt(totalAstroTokenReward, 0) && (
                <> + {formatAsset(totalAstroTokenReward, "ASTRO")}</>
              )}
            </>
          ),
        },
      ]}
    />
  )

  return !dataExists ? null : (
    <Table
      caption={
        <Caption
          title={
            <TooltipIcon content={Tooltips.My.Farming}>Farming</TooltipIcon>
          }
          description={description}
        />
      }
      rowKey={({ token, migrationRequired }) => token + migrationRequired}
      columns={[
        {
          key: "symbol",
          title: [
            "Pool Name",
            <TooltipIcon content={Tooltips.My.APR}>APR</TooltipIcon>,
          ],
          render: (symbol, { migrationRequired, delisted, apr }) => [
            <>
              {migrationRequired && (
                <Delisted>
                  <TooltipIcon content={Tooltips.My.MigrationRequired}>
                    Migration required
                  </TooltipIcon>
                </Delisted>
              )}
              {delisted && <Delisted />}
              {getLpName(symbol)}
            </>,
            migrationRequired ? (
              <Percent>0</Percent>
            ) : (
              apr && <Percent>{apr}</Percent>
            ),
          ],
          bold: true,
        },
        {
          key: "withdrawable",
          title: (
            <TooltipIcon content={Tooltips.My.Withdrawable}>
              Withdrawable
            </TooltipIcon>
          ),
          render: (withdrawable, { symbol, staked }) =>
            withdrawable && [
              <div title={formatAsset(staked, getLpName(symbol))}>
                <Formatted symbol={getSymbol(withdrawable.asset.token)}>
                  {withdrawable.asset.amount}
                </Formatted>{" "}
                +{" "}
                <Formatted symbol="uusd">{withdrawable.uusd.amount}</Formatted>
              </div>,
              <Formatted symbol="uusd">{withdrawable.value}</Formatted>,
            ],
          align: "right",
        },
        {
          key: "rewards",
          title: (
            <TooltipIcon content={Tooltips.My.FarmReward}>Reward</TooltipIcon>
          ),
          render: (rewards, { astroTokenReward }) => {
            const renderReward = (amount: string, symbol: string) => {
              return (
                <li key={symbol}>
                  <Formatted symbol={symbol}>{amount}</Formatted>
                </li>
              )
            }

            return (
              <ul>
                {renderReward(rewards, "MIR")}
                {gt(astroTokenReward, 0) &&
                  renderReward(astroTokenReward, "ASTRO")}
              </ul>
            )
          },
          align: "right",
        },
        {
          key: "actions",
          dataIndex: "token",
          render: (token, { migrationRequired }) => {
            const to = {
              pathname: getPath(MenuKey.STAKE),
              hash: StakeType.UNSTAKE,
            }

            const isMirror = getSymbol(token) === "MIR"
            const astroport = isMirror && !migrationRequired

            return (
              <>
                {!isMirror && (
                  <LinkButton
                    to={{ ...to, state: { token, astroport } }}
                    size="xs"
                    outline
                  >
                    Unbond
                  </LinkButton>
                )}
                <LinkButton
                  to={{ ...to, state: { token, withdraw: true, astroport } }}
                  size="xs"
                  outline
                >
                  Withdraw
                </LinkButton>
              </>
            )
          },
          align: "right",
          fixed: "right",
        },
      ]}
      dataSource={dataSource}
    />
  )
}

export default Farming
