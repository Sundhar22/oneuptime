import NotImplementedException from "Common/Types/Exception/NotImplementedException";
import LlmType from "../../Types/LlmType";
import CopilotActionType from "Common/Types/Copilot/CopilotActionType";
import BadDataException from "Common/Types/Exception/BadDataException";
import LLM from "../LLM/LLM";
import { GetLlmType } from "../../Config";
import Text from "Common/Types/Text";
import NotAcceptedFileExtentionForCopilotAction from "../../Exceptions/NotAcceptedFileExtention";
import LocalFile from "CommonServer/Utils/LocalFile";
import CodeRepositoryFile from "CommonServer/Utils/CodeRepository/CodeRepositoryFile";
import Dictionary from "Common/Types/Dictionary";
import { LLMPromptResult } from "../LLM/LLMBase";

export interface CopilotActionRunResult {
  files: Dictionary<CodeRepositoryFile>;
}

export interface CopilotActionPrompt {
  prompt: string;
  systemPrompt: string;
}

export interface CopilotActionVars {
  filePath: string;
  serviceFiles: Dictionary<CodeRepositoryFile>;
}

export interface CopilotProcess {
  result: CopilotActionRunResult;
  vars: CopilotActionVars;
}

export default class CopilotActionBase {
  public llmType: LlmType = LlmType.Llama;

  public copilotActionType: CopilotActionType =
    CopilotActionType.IMPROVE_COMMENTS; // temp value which will be overridden in the constructor

  public acceptFileExtentions: string[] = [];

  public constructor(data: {
    copilotActionType: CopilotActionType;
    acceptFileExtentions: string[];
  }) {
    this.llmType = GetLlmType();
    this.copilotActionType = data.copilotActionType;
    this.acceptFileExtentions = data.acceptFileExtentions;
  }

  public async onBeforeExecute(data: CopilotProcess): Promise<CopilotProcess> {
    // check if the file extension is accepted or not

    if (
      !this.acceptFileExtentions.find((item: string) => {
        return item.includes(LocalFile.getFileExtension(data.vars.filePath));
      })
    ) {
      throw new NotAcceptedFileExtentionForCopilotAction(
        `The file extension ${data.vars.filePath.split(".").pop()} is not accepted by the copilot action ${this.copilotActionType}. Ignore this file...`,
      );
    }

    return data;
  }

  public async onAfterExecute(data: CopilotProcess): Promise<CopilotProcess> {
    // do nothing
    return data;
  }

  public async getBranchName(): Promise<string> {
    const randomText: string = Text.generateRandomText(5);
    const bracnhName: string = `${Text.pascalCaseToDashes(this.copilotActionType).toLowerCase()}-${randomText}`;
    // replace -- with - in the branch name
    return Text.replaceAll(bracnhName, "--", "-");
  }

  public async getPullRequestTitle(data: {
    vars: CopilotActionVars;
  }): Promise<string> {
    return `OneUptime Copilot: ${this.copilotActionType} on ${data.vars.filePath}`;
  }

  public async getPullRequestBody(data: {
    vars: CopilotActionVars;
  }): Promise<string> {
    return `OneUptime Copilot: ${this.copilotActionType} on ${data.vars.filePath}
    
${await this.getDefaultPullRequestBody()}
    `;
  }

  public async getDefaultPullRequestBody(): Promise<string> {
    return `
    
#### Warning
This PR is generated by OneUptime Copilot. OneUptime Copilot is an AI tool that improves your code. Please do not rely on it completely. Always review the changes before merging. 

#### Feedback
If you have  any feedback or suggestions, please let us know. We would love to hear from you. Please contact us at copilot@oneuptime.com.

    `;
  }

  public async getCommitMessage(data: CopilotProcess): Promise<string> {
    return `OneUptime Copilot: ${this.copilotActionType} on ${data.vars.filePath}`;
  }

  public async refreshCopilotActionVars(
    data: CopilotProcess,
  ): Promise<CopilotProcess> {
    return Promise.resolve(data);
  }

  public async isActionComplete(_data: CopilotProcess): Promise<boolean> {
    return true; // by default the action is completed
  }

  public async cleanup(data: CopilotProcess): Promise<CopilotProcess> {
    // this code contains text as well. The code is in betwen ```<type> and ```. Please extract the code and return it.
    // for example code can be in the format of
    // ```python
    // print("Hello World")
    // ```

    // so the code to be extracted is print("Hello World")

    // the code can be in multiple lines as well.

    const actionResult: CopilotActionRunResult = data.result;

    for (const filePath in actionResult.files) {
      // check all the files which were modified by the copilot action

      const file: CodeRepositoryFile | undefined = actionResult.files[filePath];

      if (!file) {
        continue;
      }

      const extractedCode: string = file.fileContent; // this is the code in the file

      if (!extractedCode.includes("```")) {
        actionResult.files[filePath]!.fileContent = extractedCode;
      }

      actionResult.files[filePath]!.fileContent =
        extractedCode.match(/```.*\n([\s\S]*?)```/)?.[1] ?? "";
    }

    return {
      vars: data.vars,
      result: actionResult,
    };
  }

  public async filterNoOperation(
    data: CopilotProcess,
  ): Promise<CopilotProcess> {
    return Promise.resolve(data);
  }

  public async getNextFilePath(_data: CopilotProcess): Promise<string | null> {
    return null;
  }

  public async execute(data: CopilotProcess): Promise<CopilotProcess | null> {
    data = await this.onBeforeExecute(data);

    if (!data.result) {
      data.result = {
        files: {},
      };
    }

    if (!data.result.files) {
      data.result.files = {};
    }

    // get starting prompt
    data = await this.refreshCopilotActionVars(data);

    let isActionComplete: boolean = await this.isActionComplete(data);

    let aiPrommpt: CopilotActionPrompt | null = await this.getPrompt(data);

    if (!aiPrommpt) {
      return data;
    }

    while (!isActionComplete && aiPrommpt) {
      const promptResult: LLMPromptResult | null =
        await LLM.getResponse(aiPrommpt);

      if (
        promptResult &&
        promptResult.output &&
        promptResult.output.toString().length > 0
      ) {
        data.result.files[data.vars.filePath] =
          data.vars.serviceFiles[data.vars.filePath]!; // add the file to the result
        // change the content of the file.
        data.result.files[data.vars.filePath]!.fileContent =
          promptResult.output.toString();

        data = await this.cleanup(data);

        data = await this.filterNoOperation(data);
      }

      isActionComplete = await this.isActionComplete(data);

      data = await this.refreshCopilotActionVars(data);

      aiPrommpt = await this.getPrompt(data);
    }

    return await this.onAfterExecute(data);
  }

  protected async _getPrompt(
    _data: CopilotProcess,
  ): Promise<CopilotActionPrompt | null> {
    throw new NotImplementedException();
  }

  public async getPrompt(
    data: CopilotProcess,
  ): Promise<CopilotActionPrompt | null> {
    const prompt: CopilotActionPrompt | null = await this._getPrompt(data);

    if (!prompt) {
      return null;
    }

    return this.fillVarsInPrompt({
      prompt: prompt,
      vars: data.vars,
    });
  }

  private fillVarsInPrompt(data: {
    prompt: CopilotActionPrompt;
    vars: CopilotActionVars;
  }): CopilotActionPrompt {
    const { prompt, vars } = data;

    let filledPrompt: string = prompt.prompt;
    let filledSystemPrompt: string = prompt.systemPrompt;

    for (const [key, value] of Object.entries(vars)) {
      filledPrompt = filledPrompt.replace(new RegExp(`{{${key}}}`, "g"), value);
      filledSystemPrompt = filledSystemPrompt.replace(
        new RegExp(`{{${key}}}`, "g"),
        value,
      );
    }

    // check if there any unfilled vars and if there are then throw an error.

    if (filledPrompt.match(/{{.*}}/) !== null) {
      throw new BadDataException(
        `There are some unfilled vars in the prompt: ${filledPrompt}`,
      );
    }

    if (filledSystemPrompt.match(/{{.*}}/) !== null) {
      throw new BadDataException(
        `There are some unfilled vars in the system prompt: ${filledSystemPrompt}`,
      );
    }

    return {
      prompt: filledPrompt,
      systemPrompt: filledSystemPrompt,
    };
  }
}
