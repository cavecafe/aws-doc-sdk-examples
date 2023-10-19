/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Prompter } from "../prompter.js";
import { Logger } from "../logger.js";
import { SlowLogger } from "../slow-logger.js";

export class Step {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Alias for "name".
   */
  get key() {
    return this.name;
  }

  /**
   * @param {Record<string, any>} context
   */
  handle(context) {
    console.log(JSON.stringify(context));
  }
}

export class ScenarioOutput extends Step {
  /**
   * @param {string} name
   * @param {string | (context: Record<string, any>) => string} value
   * @param {{ slow: boolean }} options
   */
  constructor(name, value, options = { slow: true }) {
    super(name);
    this.value = value;
    this.options = options;
    this.slowLogger = new SlowLogger(20);
    this.logger = new Logger();
  }

  /**
   * @param {Record<string, any>} context
   */
  async handle(context) {
    const output =
      typeof this.value === "function" ? this.value(context) : this.value;
    const paddingTop = "\n";
    const paddingBottom = "\n";
    const logger = this.options.slow ? this.slowLogger : this.logger;
    await logger.log(paddingTop + output + paddingBottom);
  }
}

export class ScenarioInput extends Step {
  /**
   * @param {string} name
   * @param {string} prompt
   * @param {{ type: "confirm" | "input" | "multi-select" | "select", choices: (string | { name: string, value: string })[]} options
   */
  constructor(name, prompt, options) {
    super(name);
    this.prompt = prompt;
    this.options = options;
    this.prompter = new Prompter();
  }

  /**
   * @param {Record<string, any>} context
   */
  async handle(context) {
    const choices =
      this.options.choices && typeof this.options.choices[0] === "string"
        ? this.options.choices.map((s) => ({ name: s, value: s }))
        : this.options.choices;

    if (this.options.type === "multi-select") {
      context[this.name] = await this.prompter.checkbox({
        message: this.prompt,
        choices,
      });
    } else if (this.options.type === "select") {
      context[this.name] = await this.prompter.select({
        message: this.prompt,
        choices,
      });
    } else if (this.options.type === "input") {
      context[this.name] = await this.prompter.input({ message: this.prompt });
    } else if (this.options.type === "confirm") {
      context[this.name] = await this.prompter.confirm({
        message: this.prompt,
      });
    } else {
      throw new Error(
        `Error handling ScenarioInput, ${this.options.type} is not supported.`,
      );
    }
  }
}

export class ScenarioAction extends Step {
  /**
   *
   * @param {string} name
   * @param {(context: Record<string, any>) => Promise<void>} action
   */
  constructor(name, action) {
    super(name);
    this.action = action;
  }

  async handle(context) {
    await this.action(context);
  }
}

export class Scenario {
  /**
   * @type {Record<string, any>}
   */
  context = {};

  /**
   * @param {string} name
   * @param {(ScenarioOutput | ScenarioInput | ScenarioAction)[]} steps
   * @param {Record<string, any>} initialContext
   */
  constructor(name, steps = [], initialContext = {}) {
    this.name = name;
    this.steps = steps;
    this.context = { ...initialContext, name };
  }

  async run() {
    for (const step of this.steps) {
      await step.handle(this.context);
    }
  }
}