/*!
 * Copyright 2019-2020 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Component, ViewChild } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockTranslationService, TranslationService } from '@vcd/i18n';
import { AngularWidgetObjectFinder, TestElement } from '@vcd/widget-object';
import { CsvExporterService } from './csv-exporter.service';
import { DataExporterComponent, DataExportRequestEvent, ExportColumn } from './data-exporter.component';
import { VcdDataExporterModule } from './data-exporter.module';
import { DataExporterWidgetObject } from './data-exporter.wo';

interface HasFinder2<T> {
    finder: AngularWidgetObjectFinder<T>;
}

type TestHostFinder = HasFinder2<TestHostComponent>;
type TestExporterColumnsWithoutDisplayNameFinder = HasFinder2<TestExporterColumnsWithoutDisplayNameComponent>;

describe('DataExporterColumnsWithoutDisplayName', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VcdDataExporterModule, NoopAnimationsModule],
            providers: [
                {
                    provide: TranslationService,
                    useValue: new MockTranslationService(),
                },
            ],
            declarations: [TestExporterColumnsWithoutDisplayNameComponent],
        }).compileComponents();
    });

    beforeEach(function (this: HasFinder2<TestExporterColumnsWithoutDisplayNameComponent>): void {
        this.finder = new AngularWidgetObjectFinder(TestExporterColumnsWithoutDisplayNameComponent);
        this.finder.detectChanges();
    });

    it('uses field name if there is no displayName', function (this: TestExporterColumnsWithoutDisplayNameFinder, done): void {
        const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
        const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
        spyOn(downloadService, 'downloadCsvFile');
        spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
            const fileName = this.finder.hostComponent.component.fileName;
            await e.exportData(TestData.exportDataWithoutDisplayName);
            this.finder.detectChanges();
            const exportData: unknown[][] = [
                TestData.exportColumnsWithoutDisplayName.map((col) => col.fieldName),
                ...TestData.exportDataWithoutDisplayName.map((row) => Object.values(row)),
            ];
            const csvString = downloadService.createCsv(exportData);
            expect(downloadService.downloadCsvFile).toHaveBeenCalledWith(csvString, fileName);
            this.finder.detectChanges();
            expect(this.finder.hostComponent.dataExporterOpen).toBe(false);
            done();
        });

        exporter.getExportButton().click();
    });

    it('displays field name when there is no display name', function (this: TestExporterColumnsWithoutDisplayNameFinder): void {
        const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
        exporter.getToggleSelectAll().click();
        this.finder.detectChanges();
        const columnBubbles = exporter
            .getColumnBubbles()
            .unwrap()
            .map((i) => i.text());
        const columnCheckboxLabels = exporter
            .getColumnCheckboxes()
            .unwrap()
            .map((i) => i.text());
        const expects = ['col1', 'col2'];
        expect(columnBubbles).toEqual(expects);
        expect(columnCheckboxLabels).toEqual(expects);
    });
});

describe('VcdExportTableComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VcdDataExporterModule, NoopAnimationsModule],
            providers: [
                {
                    provide: TranslationService,
                    useValue: new MockTranslationService(),
                },
            ],
            declarations: [TestHostComponent],
        }).compileComponents();
    });

    beforeEach(function (this: HasFinder2<TestHostComponent>): void {
        this.finder = new AngularWidgetObjectFinder(TestHostComponent);
        this.finder.detectChanges();
    });

    describe('@Input: columns', () => {
        it('displays them as checkboxes', function (this: TestHostFinder): void {
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            exporter.getToggleSelectAll().click();
            expect(
                exporter
                    .getColumnBubbles()
                    .unwrap()
                    .toArray()
                    .map((it) => it.text())
            ).toEqual(['Name', 'Description']);
        });

        it('hides column checkboxes when clicked', function (this: TestHostFinder): void {
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            exporter.getToggleSelectAll().click();
            expect(
                exporter
                    .getColumnBubbles()
                    .unwrap()
                    .toArray()
                    .map((it) => it.text())
            ).toEqual(['Name', 'Description']);
            exporter.getColumnCheckboxes({ index: 0 }).click();
            expect(exporter.getColumnBubbles().unwrap().text()).toBe('Description');
        });

        it('allows the user to remove selected columns', function (this: TestHostFinder): void {
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            exporter.getToggleSelectAll().click();
            exporter.getColumnCheckboxes({ index: 0 }).click();
            expect(exporter.getColumnBubbles().unwrap().text()).toBe('Description');
        });

        it('allows the user to deselect and reselect columns', fakeAsync(function (this: TestHostFinder): void {
            this.finder.detectChanges();
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            exporter.getToggleSelectAll().click();
            exporter.getColumnCheckboxes({ index: 0 }).click();
            expect(exporter.getColumnBubbles().unwrap().text()).toBe('Description');
            exporter.getColumnCheckboxes({ index: 0 }).click();
            const actual = exporter
                .getColumnBubbles()
                .unwrap()
                .map((it) => it.text());
            expect(actual).toEqual(['Name', 'Description']);
            exporter.getColumnCheckboxes({ index: 1 }).click();
            expect(exporter.getColumnBubbles().unwrap().text()).toBe('Name');
            tick();
        }));

        it('allows the user to remove selected columns from the bubbles below the combo', function (this: TestHostFinder): void {
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            exporter.getToggleSelectAll().click();
            exporter.getColumnCheckboxArrow().click();
            const bubblesTextBeforeRemoving = exporter
                .getColumnBubbles()
                .unwrap()
                .map((it) => it.text());
            expect(bubblesTextBeforeRemoving).toEqual(['Name', 'Description']);
            exporter.getColumnBubblesX({ index: 0 }).click();
            const bubblesTextAfterRemoving = exporter
                .getColumnBubbles()
                .unwrap()
                .map((it) => it.text());
            expect(bubblesTextAfterRemoving).toEqual(['Description']);
        });
    });

    describe('@Input: fileName', () => {
        it('customizes the file to be downloaded', function (this: TestHostFinder, done): void {
            const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
            this.finder.hostComponent.component.fileName = 'my-export.csv';
            const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
            const spy = spyOn(downloadService, 'downloadCsvFile');
            spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                await e.exportData(TestData.exportData);
                expect(spy.calls.mostRecent().args[1]).toBe('my-export.csv');
                done();
            });
            exporter.getExportButton().click();
        });
    });

    describe('@Output - dataExporter', () => {
        describe('updateProgress', () => {
            it('displays a looping progress bar when set to -1', function (this: TestHostFinder): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');

                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake((e: DataExportRequestEvent) => {
                    e.updateProgress(-1);
                    this.finder.detectChanges();
                    expect(exporter.getProgress().unwrap().length()).toBe(1, 'Looping bar should have been visible');
                });
                exporter.getExportButton().click();
            });

            it('updates the progress bar when passed values', function (this: TestHostFinder): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake((e: DataExportRequestEvent) => {
                    e.updateProgress(0);
                    this.finder.detectChanges();
                    expect(Number(exporter.getProgress().unwrap().value()) / 100).toBe(0);
                    e.updateProgress(0.5);
                    this.finder.detectChanges();
                    expect(Number(exporter.getProgress().unwrap().value()) / 100).toBe(0.5);
                });
                exporter.getExportButton().click();
            });
        });

        describe('exportData', () => {
            it('dismisses the dialog and calls the service to create a client side download', function (this: TestHostFinder, done): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                    const fileName = this.finder.hostComponent.component.fileName;
                    await e.exportData(TestData.exportData);
                    this.finder.detectChanges();
                    const exportData: unknown[][] = [
                        TestData.exportColumns.map((col) => col.displayName),
                        ...TestData.exportData.map((row) => Object.values(row)),
                    ];
                    const csvString = downloadService.createCsv(exportData);
                    expect(downloadService.downloadCsvFile).toHaveBeenCalledWith(csvString, fileName);
                    this.finder.detectChanges();
                    expect(this.finder.hostComponent.component).toBeFalsy();
                    done();
                });

                exporter.getExportButton().click();
            });

            it('does not download a file if the dialog has been closed', function (this: TestHostFinder, done): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                    exporter.getCancelButton().click();
                    await e.exportData(TestData.exportData);
                    this.finder.detectChanges();
                    expect(downloadService.downloadCsvFile).not.toHaveBeenCalled();
                    this.finder.detectChanges();
                    done();
                });

                exporter.getExportButton().click();
            });

            it('uses field name if there is no matching displayName for a field', function (this: TestHostFinder, done): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                    const fileName = this.finder.hostComponent.component.fileName;
                    await e.exportData(TestData.exportDataWrongField);
                    this.finder.detectChanges();
                    // Byte order mark for UTF-8
                    const BOM = '\ufeff';
                    expect(downloadService.downloadCsvFile).toHaveBeenCalledWith(BOM + 'noexist\nJack\nJill', fileName);
                    done();
                });

                exporter.getExportButton().click();
            });

            it('allows the user to sanitize injection', function (this: TestHostFinder, done): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                    const fileName = this.finder.hostComponent.component.fileName;
                    await e.exportData(InjectionData.exportData);
                    this.finder.detectChanges();
                    const exportData: unknown[][] = [
                        TestData.exportColumns.map((col) => col.displayName),
                        ...FixedInjection.exportData.map((row) => Object.values(row)),
                    ];
                    const csvString = downloadService.createCsv(exportData);
                    expect(downloadService.downloadCsvFile).toHaveBeenCalledWith(csvString, fileName);
                    done();
                });
                exporter.getExportButton().click();
            });

            it('allows the user to export raw column names', function (this: TestHostFinder, done): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                const downloadService = TestBed.inject(CsvExporterService) as CsvExporterService;
                spyOn(downloadService, 'downloadCsvFile');
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake(async (e: DataExportRequestEvent) => {
                    const fileName = this.finder.hostComponent.component.fileName;
                    await e.exportData(TestData.exportData);
                    this.finder.detectChanges();
                    const exportData: unknown[][] = [
                        TestData.exportColumns.map((col) => col.fieldName),
                        ...TestData.exportData.map((row) => Object.values(row)),
                    ];
                    const csvString = downloadService.createCsv(exportData);
                    expect(downloadService.downloadCsvFile).toHaveBeenCalledWith(csvString, fileName);
                    done();
                });
                exporter.getToggleFriendlyNames().click();
                exporter.getExportButton().click();
            });
        });

        describe('selectedColumns', () => {
            it('contains the columns selected by the users', function (this: TestHostFinder): void {
                const exporter = this.finder.find<DataExporterWidgetObject<TestElement>>(DataExporterWidgetObject);
                spyOn(this.finder.hostComponent, 'onExportRequest').and.callFake((e: DataExportRequestEvent) => {
                    expect(e.selectedColumns).toEqual(TestData.exportColumns);
                });
                exporter.getExportButton().click();
            });
        });
    });
});

const TestData = {
    /** The progress calls that to updateProgress will be called with the following values */
    progressStates: [-1, 0.5, 1],
    exportColumns: [
        { fieldName: 'name', displayName: 'Name' },
        { fieldName: 'desc', displayName: 'Description' },
    ],
    exportColumnsWithoutDisplayName: [{ fieldName: 'col1' }, { fieldName: 'col2' }],
    exportData: [
        { name: 'Jaak', desc: 'Tis what tis' },
        { name: 'Jill', desc: 'Still tis what tis' },
    ],
    exportDataWithoutDisplayName: [
        { col1: 'hi', col2: 'alice' },
        { col1: 'Hi', col2: 'Bob' },
    ],
    exportDataWrongField: [{ noexist: 'Jack' }, { noexist: 'Jill' }],
};

const InjectionData = {
    exportData: [
        { name: '+a', desc: 'Tis what tis' },
        { name: 'Jill', desc: 'Still tis what tis' },
    ],
};

const FixedInjection = {
    exportData: [
        { name: '\t+a', desc: 'Tis what tis' },
        { name: 'Jill', desc: 'Still tis what tis' },
    ],
};

@Component({
    template: `
        <vcd-data-exporter
            *ngIf="dataExporterOpen"
            [(open)]="dataExporterOpen"
            [columns]="exportColumns"
            (dataExportRequest)="onExportRequest($event)"
        ></vcd-data-exporter>
    `,
})
class TestHostComponent {
    @ViewChild(DataExporterComponent) component: DataExporterComponent;

    dataExporterOpen = true;

    exportColumns: ExportColumn[] = TestData.exportColumns;

    onExportRequest(request: DataExportRequestEvent): void {
        // Will be mocked in tests
    }
}

@Component({
    template: `
        <vcd-data-exporter
            *ngIf="dataExporterOpen"
            [(open)]="dataExporterOpen"
            [columns]="exportColumns"
            (dataExportRequest)="onExportRequest($event)"
        ></vcd-data-exporter>
    `,
})
class TestExporterColumnsWithoutDisplayNameComponent {
    @ViewChild(DataExporterComponent) component: DataExporterComponent;

    dataExporterOpen = true;

    exportColumns: ExportColumn[] = TestData.exportColumnsWithoutDisplayName;

    onExportRequest(request: DataExportRequestEvent): void {
        // Will be mocked in tests
    }
}
