import { signingMethods, convertHexToNumber } from "@walletconnect/utils";

import { IAppState } from "../App";
import { apiGetCustomRequest } from "../helpers/api";
import { convertHexToUtf8IfPossible, methodToName } from "../helpers/utilities";
import { IRequestRenderParams, IRpcEngine } from "../helpers/types";
import { getAppControllers } from "../controllers";

export function filterEthereumRequests(payload: any) {
  return (
    payload.method.startsWith("eth_") ||
    payload.method.startsWith("net_") ||
    payload.method.startsWith("shh_") ||
    payload.method.startsWith("personal_") ||
    payload.method.startsWith("wallet_")
  );
}

export async function routeEthereumRequests(payload: any, state: IAppState, setState: any) {
  if (!state.connector) {
    return;
  }
  const { chainId, connector } = state;
  if (!signingMethods.includes(payload.method)) {
    try {
      const result = await apiGetCustomRequest(chainId, payload);
      connector.approveRequest({
        id: payload.id,
        result,
      });
    } catch (error) {
      return connector.rejectRequest({
        id: payload.id,
        error: { message: "JSON RPC method not supported" },
      });
    }
  } else {
    const requests = state.requests;
    requests.push(payload);
    await setState({ requests });
  }
}

export function renderEthereumRequests(payload: any): IRequestRenderParams[] {
  let params = [{ label: "Действие", value: methodToName(payload.method) }];

  switch (payload.method) {
    case "eth_sendTransaction":
    case "eth_signTransaction":
      params = [
        ...params,
        { label: "Отправитель", value: payload.params[0].from },
        { label: "Получатель", value: payload.params[0].to },
        {
          label: "Лимит топлива",
          value: payload.params[0].gas
            ? convertHexToNumber(payload.params[0].gas)
            : payload.params[0].gasLimit
            ? convertHexToNumber(payload.params[0].gasLimit)
            : "",
        },
        {
          label: "Цена топлива",
          value: convertHexToNumber(payload.params[0].gasPrice),
        },
        {
          label: "Номер",
          value: convertHexToNumber(payload.params[0].nonce),
        },
        {
          label: "Сумма перевода",
          value: payload.params[0].value ? convertHexToNumber(payload.params[0].value) : "",
        },
        { label: "Данные", value: payload.params[0].data },
      ];
      break;

    case "eth_sign":
      params = [
        ...params,
        { label: "Адрес", value: payload.params[0] },
        { label: "Сообщение", value: payload.params[1] },
      ];
      break;
    case "personal_sign":
      params = [
        ...params,
        { label: "Адрес", value: payload.params[1] },
        {
          label: "Сообщение",
          value: convertHexToUtf8IfPossible(payload.params[0]),
        },
      ];
      break;
    default:
      params = [
        ...params,
        {
          label: "Параметры",
          value: JSON.stringify(payload.params, null, "\t"),
        },
      ];
      break;
  }
  return params;
}

export async function signEthereumRequests(payload: any, state: IAppState, setState: any) {
  const { connector, address, activeIndex, chainId } = state;

  let errorMsg = "";
  let result = null;

  if (connector) {
    if (!getAppControllers().wallet.isActive()) {
      await getAppControllers().wallet.init(activeIndex, chainId);
    }

    let transaction = null;
    let dataToSign = null;
    let addressRequested = null;

    switch (payload.method) {
      case "eth_sendTransaction":
        transaction = payload.params[0];
        addressRequested = transaction.from;
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.sendTransaction(transaction);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_signTransaction":
        transaction = payload.params[0];
        addressRequested = transaction.from;
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signTransaction(transaction);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_sign":
        dataToSign = payload.params[1];
        addressRequested = payload.params[0];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signMessage(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "personal_sign":
        dataToSign = payload.params[0];
        addressRequested = payload.params[1];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signPersonalMessage(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_signTypedData":
        dataToSign = payload.params[1];
        addressRequested = payload.params[0];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signTypedData(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      default:
        break;
    }

    if (result) {
      connector.approveRequest({
        id: payload.id,
        result,
      });
    } else {
      let message = "JSON RPC method not supported";
      if (errorMsg) {
        message = errorMsg;
      }
      if (!getAppControllers().wallet.isActive()) {
        message = "No Active Account";
      }
      connector.rejectRequest({
        id: payload.id,
        error: { message },
      });
    }
  }
}

const ethereum: IRpcEngine = {
  filter: filterEthereumRequests,
  router: routeEthereumRequests,
  render: renderEthereumRequests,
  signer: signEthereumRequests,
};

export default ethereum;
