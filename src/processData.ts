import { IPB, PBSpread } from "./pbSpread";

export function processData(spreadsheetData: any, host: PBSpread) {
    host.athletes = spreadsheetData.map((sheetItem: any) => {
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
    host.athletes.forEach((athlete) => {
        for (let session of host.sessions) {
            let thisPB = (athlete as any)[session.key] as IPB;
            session.results.push({
                athlete: athlete.name,
                result: thisPB,
            });
            if (!thisPB) {
                continue;
            }
            for (let _session of host.sessions) {
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
    for (let session of host.sessions) {
        let totalWatts = 0;
        let validSessions = 0;

        console.log(session);

        session.results.forEach((resultEntry) => {
            if (resultEntry.result?.watts) {
                totalWatts += resultEntry.result.watts;
                validSessions++;
            }
            /* for (let _session of sessions) {
                    let diff = (resultEntry.result as any)[
                        _session.key + "diff"
                    ];
                    if (diff) {
                        minDiff = Math.min(minDiff, diff);
                        maxDiff = Math.max(maxDiff, diff);
                        totalDiffs += diff;
                    }
                } */
        });
        let avgWatts = totalWatts / validSessions;
        let paceSeconds = Math.cbrt(2.8 / avgWatts) * 500;
        session.average = {
            paceString: numberToTimeString(paceSeconds),
            watts: avgWatts,
            paceSeconds: paceSeconds,
        };
    }

    for (let session of host.sessions) {
        let thisPB = session.average?.watts;

        if (!thisPB) {
            continue;
        }

        for (let _session of host.sessions) {
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

    for (let session of host.sessions) {
        session.results.sort((a, b) => {
            return (b.result?.watts || 0) - (a.result?.watts || 0);
        });

        session.results.forEach((result, index) => {
            let matchedAthlete = host.athletes.find(
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

    return finalString;
}

function generateInitials(name: string): string {
    let splitName = name.split(" ");
    return (
        splitName[0].slice(0, 1).toUpperCase() +
        splitName[1].slice(0, 1).toUpperCase()
    );
}
