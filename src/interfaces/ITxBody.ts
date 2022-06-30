import { BigNumber } from "ethers";

export interface ITxBody {
    to: string
    value: string | BigNumber
    data?: string
    gasPrice?: string | BigNumber
    gasLimit?: string | BigNumber
}