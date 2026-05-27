import { IResult } from "@shared/types/result-types";

export interface IValidator {
    validate(): IResult;
}