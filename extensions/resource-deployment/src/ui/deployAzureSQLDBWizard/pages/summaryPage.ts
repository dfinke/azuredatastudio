/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import { WizardPageBase } from '../../wizardPageBase';
import { DeployAzureSQLDBWizard } from '../deployAzureSQLDBWizard';

export class AzureSQLDBSummaryPage extends WizardPageBase<DeployAzureSQLDBWizard> {

	private _form!: azdata.FormContainer;

	constructor(wizard: DeployAzureSQLDBWizard) {
		super(
			'Summary Page',
			'',
			wizard
		);

	}

	public async initialize() {
		this.pageObject.registerContent(async (view: azdata.ModelView) => {



			this._form = view.modelBuilder.formContainer()
				.withFormItems(
					[
						{
							component: this.createSummaryRow(view, 'Azure accounts', '')
						}
					],
					{
						horizontal: false,
						componentWidth: '100%'
					})
				.withLayout({ width: '100%' })
				.component();

			return view.initializeModel(this._form);
		});
	}

	public async onEnter(): Promise<void> {
		this.wizard.wizardObject.registerNavigationValidator((pcInfo) => {
			return true;
		});
	}

	public onLeave(): void {
		this.wizard.wizardObject.registerNavigationValidator((pcInfo) => {
			return true;
		});
	}

	private createSummaryRow(view: azdata.ModelView, title: string, value: string) {
		let text = view.modelBuilder.text().withProperties(<azdata.InputBoxProperties>{
			value: value
		}).component();
		return this.wizard.createFormRowComponent(view, title, '', text, false);
	}

}