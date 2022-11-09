import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import Papa from "papaparse";
import { processData } from "./processData";

export interface IAthlete {
    name: string;
    initials: string;
    m100: IPB | null;
    min1: IPB | null;
    m500: IPB | null;
    k1: IPB | null;
    min4: IPB | null;
    k2: IPB | null;
    k5: IPB | null;
    k6: IPB | null;
    min30: IPB | null;
    k10: IPB | null;
    min60: IPB | null;
    hm: IPB | null;
    fm: IPB | null;
}

export interface IPB {
    paceString: string;
    paceSeconds: number;
    watts: number;
    rank?: number;
    m100diff?: number;
    min1diff?: number;
    m500diff?: number;
    k1diff?: number;
    min4diff?: number;
    k2diff?: number;
    k5diff?: number;
    k6diff?: number;
    min30diff?: number;
    k10diff?: number;
    min60diff?: number;
    hmdiff?: number;
    fmdiff?: number;
}

export interface ISession {
    title: string;
    key: string;
    results: { athlete: string; result: IPB }[];
    average?: IPB;
}

@customElement("pb-spread")
export class PBSpread extends LitElement {
    sessions: ISession[] = [
        {
            title: "100m",
            key: "m100",
            results: [],
        },
        {
            title: "1:00",
            key: "min1",
            results: [],
        },
        {
            title: "500m",
            key: "m500",
            results: [],
        },
        {
            title: "1km",
            key: "k1",
            results: [],
        },
        {
            title: "4:00",
            key: "min4",
            results: [],
        },
        {
            title: "2km",
            key: "k2",
            results: [],
        },
        {
            title: "5km",
            key: "k5",
            results: [],
        },
        {
            title: "6km",
            key: "k6",
            results: [],
        },
        {
            title: "30:00",
            key: "min30",
            results: [],
        },
        {
            title: "10km",
            key: "k10",
            results: [],
        },
        {
            title: "60:00",
            key: "min60",
            results: [],
        },
        {
            title: "HM",
            key: "hm",
            results: [],
        },
        {
            title: "FM",
            key: "fm",
            results: [],
        },
    ];

    sheetURL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDWufPve2XsWDSKZGdAS6KBlOwez5HBd58B7oI36OvZajU7a1c7YPFR2JM9JbaZmtoSShjuwK4VeyP/pub?output=csv";

    connectedCallback(): void {
        super.connectedCallback();
        Papa.parse(this.sheetURL, {
            download: true,
            header: true,
            complete: (results: any) => {
                processData(results.data, this);
                this.requestUpdate();
            },
        });
    }

    athletes: IAthlete[] = [];

    render() {
        return html`
            ${this.athletes.length}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "pb-spread": PBSpread;
    }
}
