import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import Papa from "papaparse";

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
    results: { athlete: string; watts: number | null }[];
    average?: IPB;
}

let sessions: ISession[] = [
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

@customElement("pb-spread")
export class PBSpread extends LitElement {
    sheetURL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDWufPve2XsWDSKZGdAS6KBlOwez5HBd58B7oI36OvZajU7a1c7YPFR2JM9JbaZmtoSShjuwK4VeyP/pub?output=csv";

    connectedCallback(): void {
        Papa.parse(this.sheetURL, {
            download: true,
            header: true,
            complete: (results: any) => {
                this.processData(results.data);
            },
        });
    }

    processData(spreadsheetData: any[]) {
        this.athletes = spreadsheetData.map((sheetItem) => {
            return {
                name: sheetItem.Athlete,
                initials: generateInitials(sheetItem.Athlete),
                m100: extractPB(sheetItem["100m"]),
                min1: extractPB(sheetItem["1min"]),
                m500: extractPB(sheetItem["500m"]),
                k1: extractPB(sheetItem["1km"]),
                min4: extractPB(sheetItem["4min"]),
                k2: extractPB(sheetItem["2km"]),
                k5: extractPB(sheetItem["5km"]),
                k6: extractPB(sheetItem["6k"]),
                min30: extractPB(sheetItem["30min"]),
                k10: extractPB(sheetItem["10km"]),
                min60: extractPB(sheetItem["60min"]),
                hm: extractPB(sheetItem["HM"]),
                fm: extractPB(sheetItem["FM"]),
            };
        });

        // Work out diffs
        this.athletes.forEach((athlete) => {
            for (let session of sessions) {
                let thisPB = (athlete as any)[session.key] as IPB;
                session.results.push({
                    athlete: athlete.name,
                    watts: thisPB?.watts || null,
                });
                if (!thisPB) {
                    continue;
                }
                for (let _session of sessions) {
                    let comparePB = (athlete as any)[_session.key] as IPB;
                    let thisDiff;

                    if (!comparePB) {
                        thisDiff = null;
                    } else {
                        thisDiff = thisPB.watts / comparePB.watts;
                    }

                    (thisPB as any)[_session.key + "diff"] = thisDiff;
                }
            }
        });

        for (let session of sessions) {
            let totalWatts = 0;
            let validSessions = 0;
            session.results.forEach((result) => {
                if (result.watts) {
                    totalWatts += result.watts;
                    validSessions++;
                }
            });
            let avgWatts = totalWatts / validSessions;
            let paceSeconds = Math.cbrt(2.8 / avgWatts) * 500;
            session.average = {
                paceString: numberToTimeString(paceSeconds),
                watts: avgWatts,
                paceSeconds: paceSeconds,
            };
        }

        for (let session of sessions) {
            let thisPB = session.average?.watts;

            if (!thisPB) {
                continue;
            }

            for (let _session of sessions) {
                let comparePB = _session.average?.watts;

                let thisDiff;

                if (!comparePB) {
                    thisDiff = null;
                } else {
                    thisDiff = thisPB / comparePB;
                }

                (session.average as any)[_session.key + "diff"] = thisDiff;
            }
        }

        for (let session of sessions) {
            session.results.sort((a, b) => {
                return (a.watts || 0) - (b.watts || 0);
            });

            session.results.forEach((result, index) => {
                let matchedAthlete = this.athletes.find(
                    (athlete) => athlete.name === result.athlete
                );

                if (matchedAthlete) {
                    let workout = (matchedAthlete as any)[session.key];
                    if (workout) {
                        workout.rank = index;
                    }
                }
            });
        }

        console.log(sessions);
    }

    athletes: IAthlete[] = [];

    render() {
        return html``;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "pb-spread": PBSpread;
    }
}

function extractPB(pbString: string): IPB | null {
    if (pbString === "") {
        return null;
    }
    let pb;

    if (pbString.indexOf("(") < 0) {
        pb = pbString;
    } else {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(pbString);
        pb = matches?.[1];
    }

    if (!pb) {
        return null;
    }

    let pbMins = parseInt(pb?.split(":")[0]);
    let pbSecs = pbMins * 60 + parseFloat(pb?.split(":")[1]);
    let watts = 2.8 / Math.pow(pbSecs / 500, 3);

    return {
        paceString: pb,
        paceSeconds: pbSecs,
        watts: watts,
    };
}

export function numberToTimeString(input: number): string {
    input *= 10;
    if (!input) {
        return "0:00.0";
    }
    let hours = Math.floor(input / 10 / 60 / 60);
    let mins = Math.floor(input / 10 / 60);
    let secs = Math.floor(input / 10);
    let tenths = Math.floor(input);

    tenths -= secs * 10;
    secs -= mins * 60;
    mins -= hours * 60;

    let finalString = "";

    if (hours > 0) {
        finalString += hours.toFixed(0) + ":";
    }

    if (mins > 0 && mins < 10 && hours > 0) {
        finalString += "0" + mins.toFixed(0) + ":";
    } else if (mins > 0) {
        finalString += mins.toFixed(0) + ":";
    }

    if (secs > 0 && secs < 10 && (mins > 0 || hours > 0)) {
        finalString += "0" + secs.toFixed(0) + ".";
    } else if (secs > 0) {
        finalString += secs.toFixed(0) + ".";
    } else {
        finalString += "00.";
    }

    finalString += tenths.toFixed(0);

    console.log(finalString);

    return finalString;
}

function generateInitials(name: string): string {
    let splitName = name.split(" ");
    return (
        splitName[0].slice(0, 1).toUpperCase() +
        splitName[1].slice(0, 1).toUpperCase()
    );
}
