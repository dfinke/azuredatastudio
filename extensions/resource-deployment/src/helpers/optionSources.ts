/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as arc from 'arc';
import { CategoryValue } from 'azdata';
import { IOptionsSource } from '../interfaces';
import * as loc from '../localizedConstants';
import { apiService } from '../services/apiService';
import { throwUnless } from '../utils';
import { CacheManager } from './cacheManager';


export type OptionsSourceType = 'ArcControllersOptionsSource';

const OptionsSources = new Map<OptionsSourceType, new () => OptionsSource>();
export abstract class OptionsSource implements IOptionsSource {

	private _variableNames!: { [index: string]: string; };
	private _type!: OptionsSourceType;

	get type(): OptionsSourceType { return this._type; }
	get variableNames(): { [index: string]: string; } { return this._variableNames; }

	abstract async getOptions(): Promise<string[] | CategoryValue[]>;
	abstract async getVariableValue(variableName: string, input: string): Promise<string>;
	abstract getIsPassword(variableName: string): boolean;

	protected constructor() {
	}

	static construct(optionsSourceType: OptionsSourceType, variableNames: { [index: string]: string }): OptionsSource {
		console.log(`CONSTRUCTING ${optionsSourceType}`);
		const sourceConstructor = OptionsSources.get(optionsSourceType);
		throwUnless(sourceConstructor !== undefined, loc.noOptionsSourceDefined(optionsSourceType));
		const obj = new sourceConstructor();
		obj._type = optionsSourceType;
		obj._variableNames = variableNames;
		return obj;
	}
}

export class ArcControllersOptionsSource extends OptionsSource {
	private _cacheManager = new CacheManager<string, string>();
	constructor() {
		super();
	}

	async getOptions(): Promise<string[] | CategoryValue[]> {
		console.log(`GET OPTIONS ${apiService.arcApi}`);
		const controllers = await apiService.arcApi.getRegisteredDataControllers();
		console.log(`GOT CONTROLLERS ${controllers}`);
		throwUnless(controllers !== undefined && controllers.length !== 0, loc.noControllersConnected);
		return controllers.map(ci => {
			return ci.label;
		});
	}

	async getVariableValue(variableName: string, controllerLabel: string): Promise<string> {
		const retrieveVariable = async (key: string) => {
			const [variableName, controllerLabel] = JSON.parse(key);
			const controllers = await apiService.arcApi.getRegisteredDataControllers();
			const controller = controllers!.find(ci => ci.label === controllerLabel);
			throwUnless(controller !== undefined, loc.noControllerInfoFound(controllerLabel));
			switch (variableName) {
				case 'endpoint':
					return controller.info.url;
				case 'username':
					return controller.info.username;
				case 'password':
					const fetchedPassword = await this.getPassword(controller);
					return fetchedPassword;
				default:
					throw new Error(loc.variableValueFetchForUnsupportedVariable(variableName));
			}
		};
		const variableValue = await this._cacheManager.getCacheEntry(JSON.stringify([variableName, controllerLabel]), retrieveVariable);
		return variableValue;
	}

	private async getPassword(controller: arc.DataController): Promise<string> {
		let password = await apiService.arcApi.getControllerPassword(controller.info);
		if (!password) {
			password = await apiService.arcApi.reacquireControllerPassword(controller.info, password);
		}
		throwUnless(password !== undefined, loc.noPasswordFound(controller.label));
		return password;
	}

	getIsPassword(variableName: string): boolean {
		switch (variableName) {
			case 'endpoint':
			case 'username':
				return false;
			case 'password':
				return true;
			default:
				throw new Error(loc.isPasswordFetchForUnsupportedVariable(variableName));
		}
	}
}
OptionsSources.set(<OptionsSourceType>ArcControllersOptionsSource.name, ArcControllersOptionsSource);
