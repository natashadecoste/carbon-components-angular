import { TableModel, TableItem } from "./table.module";
import {
	Component,
	AfterContentChecked,
	ApplicationRef,
	Input,
	Output,
	ViewChild,
	ContentChildren,
	EventEmitter,
	ViewEncapsulation
} from "@angular/core";

/**
 * Build your table with this component by extending things that differ from default.
 *
 * selector: `n-table`
 * demo: [https://pages.github.ibm.com/peretz/neutrino/#/table](https://pages.github.ibm.com/peretz/neutrino/#/table)
 *
 * ## Build your own table footer with neutrino components
 *
 * ```html
 * <p class="table-footer">
 * 	<span class="table-selection-info">{{model.selectedRowsCount()}} of {{model.totalDataLength}} rows selected</span>
 * 	<n-table-pagination [model]="model" (selectPage)="selectPage($event)"></n-table-pagination>
 * 	<n-table-goto-page (selectPage)="selectPage($event)"></n-table-goto-page>
 * </p>
 * ```
 *
 * `selectPage()` function should fetch the data from backend, create new `data`, apply it to `model.data`,
 * and update `model.currentPage`.
 *
 * If the data your server returns is a two dimensional array of objects, it would look something like this:
 *
 * ```typescript
 * selectPage(page) {
 * 	this.service.getPage(page).then((data: Array<Array<any>>) => {
 * 		let newData = [];
 *
 * 		// create new data from the service data
 * 		data.forEach(dataRow => {
 * 			let row = [];
 * 			dataRow.forEach(dataElement => {
 * 				row.push(new TableItem({
 * 					data: dataElement,
 * 					template: typeof dataElement === "string" ? undefined : this.customTableItemTemplate
 * 					// your template can handle all the data types so you don't have to conditionally set it
 * 					// you can also set different templates for different columns based on index
 * 				}));
 * 			});
 * 			newData.push(row);
 * 		});
 *
 * 		// set the data and update page
 * 		this.model.data = newData;
 * 		this.model.currentPage = page;
 * 	});
 * }
 * ```
 *
 * @export
 * @class Table
 * @implements {AfterContentChecked}
 */
@Component({
	selector: "n-table",
	template: `
	<table [ngClass]="{
		'table--sm': size === 'sm',
		'table': size === 'default',
		'table--lg': size === 'lg'
	}">
		<thead>
			<tr>
				<th class="table_checkbox-col" *ngIf="enableRowSelect">
					<n-checkbox
						[size]="size === 'sm' ? size : 'default'"
						[(ngModel)]="selectAllCheckbox"
						[indeterminate]="selectAllCheckboxSomeSelected"
						(change)="onSelectAllCheckboxChange()">
					</n-checkbox>
				</th>
				<ng-container *ngFor="let column of model.header; let i = index">
					<th
						*ngIf="column.visible"
						[ngStyle]="column.style">
						<div class="table_cell-wrapper">
							<span class="table_data-wrapper"
								(click)="sort.emit(i)">
								<span *ngIf="!column.template" [title]="column.data">{{column.data}}</span>
								<ng-template
									[ngTemplateOutlet]="column.template" [ngTemplateOutletContext]="{data: column.data}">
								</ng-template>
							</span>
							<span class="thead_sort" (click)="sort.emit(i)">
								<!-- arrow up -->
								<svg
									*ngIf="column.descending && column.sorted"
									xmlns="http://www.w3.org/2000/svg"
									class="icon--sm"
									width="16"
									height="16"
									viewBox="0 0 16 16">
									<path d="M13.5 5.5L8 0 2.5 5.5l1 1 3.8-3.8V16h1.4V2.7l3.8 3.8z"/>
								</svg>
								<!-- arrow down -->
								<svg
									*ngIf="column.ascending && column.sorted"
									xmlns="http://www.w3.org/2000/svg"
									class="icon--sm"
									width="16"
									height="16"
									viewBox="0 0 16 16">
									<path d="M13.5 10.5L8 16l-5.5-5.5 1-1 3.8 3.8V0h1.4v13.3l3.8-3.8z"/>
								</svg>
							</span>
							<button class="thead_filter-btn btn--icon-link"
								[ngClass]="{'filter-enabled': column.filterCount > 0}"
								*ngIf="column.filterTemplate"
								type="button"
								aria-expanded="false"
								aria-haspopup="true"
								[nPopover]="column.filterTemplate"
								[footer]="column.filterFooter"
								title="Filter"
								placement="right-bottom"
								popoverFilter="true"
								[appendToBody]="true"
								[data]="column.filterData">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="icon--sm"
									width="16"
									height="16"
									viewBox="0 0 16 16">
									<path d="M0 0v3l6 8v5h4v-5l6-8V0H0zm9 10.7V15H7v-4.3L1.3 3h13.5L9 10.7z"/>
								</svg>
								<span *ngIf="column.filterCount > 0">
									{{column.filterCount}}
								</span>
							</button>
						</div>
					</th>
				</ng-container>
			</tr>
		</thead>
		<tbody [ngClass]="{'table_tbody--striped': striped}" (scroll)="onScroll($event)">
			<ng-container *ngFor="let row of model.data; let i = index">
				<tr *ngIf="!model.isRowFiltered(i)"
					[ngClass]="{selected: model.rowsSelected[i]}">
					<td class="table_checkbox-col" *ngIf="enableRowSelect">
						<n-checkbox
							[size]="size === 'sm' ? size : 'default'"
							[(ngModel)]="model.rowsSelected[i]"
							(change)="onRowCheckboxChange(i)">
						</n-checkbox>
					</td>
					<ng-container *ngFor="let item of row; let i = index">
						<td *ngIf="model.header[i].visible"
							[ngStyle]="model.header[i].style">
							<div class="table_cell-wrapper">
								<span *ngIf="!item.template" class="table_data-wrapper" [title]="item.data">{{item.data}}</span>
								<ng-template
									[ngTemplateOutlet]="item.template" [ngTemplateOutletContext]="{data: item.data}">
								</ng-template>
							</div>
						</td>
					</ng-container>
				</tr>
			</ng-container>
		</tbody>
	</table>
	`
})
export class Table {
	/**
	 * Size of the table rows.
	 *
	 * @type {("default" | "sm" | "lg")}
	 * @memberof Table
	 */
	@Input() size: "default" | "sm" | "lg" = "default";

	/**
	 * `TableModel` with data the table is to display.
	 *
	 * @type {TableModel}
	 * @memberof Table
	 */
	@Input() model: TableModel;

	/**
	 * Controls whether to show the selection checkboxes column or not.
	 *
	 * @type {boolean}
	 * @memberof Table
	 */
	@Input() enableRowSelect = true;

	/**
	 * Distance (in px) from the bottom that view has to reach before
	 * `scrollLoad` event is emitted.
	 *
	 * @type {number}
	 * @memberof Table
	 */
	@Input() scrollLoadDistance = 0;

	/**
	 * Controls if all checkboxes are viewed as selected.
	 *
	 * @type {boolean}
	 * @memberof Table
	 */
	selectAllCheckbox = false;

	/**
	 * Controls the indeterminate state of the header checkbox.
	 *
	 * @type {boolean}
	 * @memberof Table
	 */
	selectAllCheckboxSomeSelected = false;

	/**
	 * Set to `true` to make table rows striped.
	 *
	 * @type {boolean}
	 * @memberof Table
	 */
	@Input() striped = false;

	/**
	 * Emits an index of the column that wants to be sorted.
	 *
	 * @memberof Table
	 */
	@Output() sort = new EventEmitter<number>();

	/**
	 * Emits if all rows are selected.
	 *
	 * @param {TableModel} model
	 * @memberof Table
	 */
	@Output() selectAll = new EventEmitter<Object>();

	/**
	 * Emits if all rows are deselected.
	 *
	 * @param {TableModel} model
	 * @memberof Table
	 */
	@Output() deselectAll = new EventEmitter<Object>();

	/**
	 * Emits if a single row is selected.
	 *
	 * @param {Object} ({model: this.model, selectedRowIndex: index})
	 * @memberof Table
	 */
	@Output() selectRow = new EventEmitter<Object>();

	/**
	 * Emits if a single row is deselected.
	 *
	 * @param {Object} ({model: this.model, selectedRowIndex: index})
	 * @memberof Table
	 */
	@Output() deselectRow = new EventEmitter<Object>();

	/**
	 * Emits when `distanceFromBottom <= this.scrollLoadDistance`.
	 *
	 * @param {TableModel} model
	 * @memberof Table
	 */
	@Output() scrollLoad = new EventEmitter<TableModel>();

	/**
	 * Creates an instance of Table.
	 *
	 * @param {ApplicationRef} applicationRef
	 * @memberof Table
	 */
	constructor(private applicationRef: ApplicationRef) {}

	/**
	 * Triggered whenever the header checkbox is clicked.
	 * Updates all the checkboxes in the table view.
	 * Emits the `selectAll` or `deselectAll` event.
	 *
	 * @memberof Table
	 */
	onSelectAllCheckboxChange() {
		this.applicationRef.tick();  // give app time to process the click if needed

		if (this.selectAllCheckboxSomeSelected) {
			this.selectAllCheckbox = false; // clear all boxes
			this.deselectAll.emit(this.model);
		}

		if (this.selectAllCheckbox) {
			this.selectAll.emit(this.model);
		} else {
			this.deselectAll.emit(this.model);
		}

		this.selectAllCheckboxSomeSelected = false;

		for (let i = 0; i < this.model.rowsSelected.length; i++) {
			this.model.rowsSelected[i] = this.selectAllCheckbox;
		}
	}

	/**
	 * Triggered when a single row is clicked.
	 * Updates the header checkbox state.
	 * Emits the `selectRow` or `deselectRow` event.
	 *
	 * @param {number} index
	 * @returns
	 * @memberof Table
	 */
	onRowCheckboxChange(index: number) {
		let startValue = this.model.rowsSelected[0];

		if (this.model.rowsSelected[index]) {
			this.selectRow.emit({model: this.model, selectedRowIndex: index});
		} else {
			this.deselectRow.emit({model: this.model, selectedRowIndex: index});
		}

		for (let i = 1; i < this.model.rowsSelected.length; i++) {
			let one = this.model.rowsSelected[i];

			if (!!one !== !!startValue) {  // !! essentially converts to boolean and we want undefined to be false
				// set indeterminate
				this.selectAllCheckbox = false;
				this.selectAllCheckboxSomeSelected = true;
				return;
			}
		}

		this.selectAllCheckboxSomeSelected = false;
		this.selectAllCheckbox = startValue;
	}

	/**
	 * Triggered when the user scrolls on the `<tbody>` element.
	 * Enmits the `scrollLoad` event.
	 *
	 * @param {any} event
	 * @memberof Table
	 */
	onScroll(event) {
		const distanceFromBottom = event.target.scrollHeight - event.target.clientHeight - event.target.scrollTop;

		if (distanceFromBottom <= this.scrollLoadDistance) {
			this.scrollLoad.emit(this.model);
		}
	}
}
