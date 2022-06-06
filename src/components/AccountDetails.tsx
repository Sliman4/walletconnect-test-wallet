import * as React from "react";
import styled from "styled-components";
import Dropdown, { SRow } from "../components/Dropdown";
import { IChainData } from "../helpers/types";
import { ellipseAddress, getViewportDimensions } from "../helpers/utilities";
import { colors, responsive } from "../styles";
import Blockie from "./Blockie";
import Button from "./Button";

const SSection = styled.div`
  width: 100%;
`;

const SBlockie = styled(Blockie)`
  margin-right: 5px;
  @media screen and (${responsive.xs.max}) {
    margin-right: 1vw;
  }
`;

const SAddressDropdownWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SAddressButton = styled(Button)`
  width: 90%;
  height: 40px;
  padding: 0;
  background-color: rgb(${colors.white});
  color: rgb(${colors.black});
  font-family: monospace;
`;

interface IAccountDetailsProps {
  chains: IChainData[];
  updateAddress?: any;
  updateChain?: any;
  accounts: string[];
  activeIndex: number;
  address: string;
  chainId: number;
}

const AccountDetails = (props: IAccountDetailsProps) => {
  const { chains, chainId, address, activeIndex, accounts, updateChain } = props;
  const windowWidth = getViewportDimensions().x;
  const maxWidth = 468;
  const maxChar = 12;
  const ellipseLength =
    windowWidth > maxWidth ? maxChar : Math.floor(windowWidth * (maxChar / maxWidth));
  const accountsMap = accounts.map((addr: string, index: number) => ({
    index,
    display_address: ellipseAddress(addr, ellipseLength),
  }));
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address);
  };
  return (
    <React.Fragment>
      <SSection>
        <h6>{"Аккаунт"}</h6>
        <SAddressDropdownWrapper>
          <SBlockie size={40} address={address} />
          <SAddressButton onClick={copyAddressToClipboard}>
            <SRow>
              <svg
                style={{ float: "right", marginTop: "calc((16px - 24px) / 2)" }}
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="24px"
                width="24px"
              >
                <path
                  d="M16,1 H4 c-1.1,0,-2,.9,-2,2 v14 h2 V3 h12 V1 z m3,4 H8 c-1.1,0,-2,.9,-2,2 v14
                 c0,1.1,.9,2,2,2 h11 c1.1,0,2,-.9,2,-2 V7 c0,-1.1,-.9,-2,-2,-2 z m0,16 H8 V7 h11 v14 z"
                />
              </svg>
              {accountsMap[activeIndex].display_address}
            </SRow>
          </SAddressButton>
        </SAddressDropdownWrapper>
      </SSection>
      <SSection>
        <h6>{"Сеть"}</h6>
        <Dropdown
          selected={chainId}
          options={chains}
          displayKey={"name"}
          targetKey={"chain_id"}
          onChange={updateChain}
        />
      </SSection>
    </React.Fragment>
  );
};
export default AccountDetails;
