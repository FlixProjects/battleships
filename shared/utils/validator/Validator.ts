import { IResult } from "@shared/types/result-types";
import { IValidator } from "./types";

export abstract class Validator implements IValidator {
    abstract validate(): IResult;
}
