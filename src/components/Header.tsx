import * as React from "react";
import styled from "styled-components";

import Blockie from "./Blockie";
import { ellipseAddress, getChainData } from "../helpers/utilities";
import { fonts, responsive, transitions } from "../styles";
import Button from "./Button";

const SHeader = styled.div`
  margin-top: -1px;
  margin-bottom: 1px;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  @media screen and (${responsive.sm.max}) {
    font-size: ${fonts.size.small};
  }
`;

const SActiveAccount = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  font-weight: 500;
`;

const SActiveChain = styled(SActiveAccount as any)`
  flex-direction: column;
  text-align: left;
  align-items: flex-start;
  & p {
    font-size: 0.8em;
    margin: 0;
    padding: 0;
  }
  & p:nth-child(2) {
    font-weight: bold;
  }
`;

const SGetCryptoButton = styled(Button)`
  margin: 5px;
`;

interface IHeaderStyle {
  connected: boolean;
}

const SAddress = styled.p<IHeaderStyle>`
  transition: ${transitions.base};
  font-weight: bold;
  margin: ${({ connected }) => (connected ? "-2px auto 0.7em" : "0")};
`;

const SBlockie = styled(Blockie)`
  margin-right: 10px;
`;

const SDisconnect = styled.div<IHeaderStyle>`
  transition: ${transitions.button};
  font-size: 12px;
  font-family: monospace;
  position: absolute;
  right: 0;
  top: 20px;
  opacity: 0.7;
  cursor: pointer;

  opacity: ${({ connected }) => (connected ? 1 : 0)};
  visibility: ${({ connected }) => (connected ? "visible" : "hidden")};
  pointer-events: ${({ connected }) => (connected ? "auto" : "none")};

  &:hover {
    transform: translateY(-1px);
    opacity: 0.5;
  }
`;

interface IHeaderProps {
  killSession: () => void;
  connected: boolean;
  address: string;
  chainId: number;
}

const Header = (props: IHeaderProps) => {
  const { connected, address, chainId, killSession } = props;
  const activeChain = chainId ? getChainData(chainId) : null;
  const getNativeCurrency = () => {
    if (activeChain?.faucet_url !== undefined) {
      window.open(activeChain.faucet_url, "_blank");
    } else {
      alert("Эта кнопка будет работать после начала открытого тестирования");
    }
  };
  const getCraft = () => {
    alert("Эта кнопка будет работать после начала открытого тестирования");
  };
  return (
    <SHeader {...props}>
      {activeChain && (
        <SActiveChain>
          <p>{`Подключено к`}</p>
          <p>{activeChain.name}</p>
        </SActiveChain>
      )}
      {address && (
        <SActiveAccount>
          <SBlockie address={address} />
          <SAddress connected={connected}>{ellipseAddress(address)}</SAddress>
          <SDisconnect connected={connected} onClick={killSession}>
            {"Отключить"}
          </SDisconnect>
        </SActiveAccount>
      )}
      {activeChain && (
        <>
          <SGetCryptoButton onClick={getNativeCurrency}>
            {`Получить ${activeChain.native_currency.symbol}`}
          </SGetCryptoButton>
          <SGetCryptoButton onClick={getCraft}>{`Получить CRAFT`}</SGetCryptoButton>
        </>
      )}
    </SHeader>
  );
};

export default Header;
