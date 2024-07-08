import makeId from "/utils/makeId.js";

function getRandomItem(arr) {
    return arr.at(random(0, arr.length - 1));
}

function randomDate(
    start = new Date("1970-05-01"),
    end = new Date(),
    startHour = 0,
    endHour = 23
) {
    var date = new Date(+start + Math.random() * (end - start));
    var hour = (startHour + Math.random() * (endHour - startHour)) | 0;
    date.setHours(hour);
    return date;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + (min));
}
const types = ["Research", "Personal"];
const generators = [generateResearchParagraph, generatePersonalParagraph];

/**
 * @param {string} searchQuery
 * @returns {{ title: string, paragraph: string }}
 */
export default function generateBrowserEntry(searchQuery) {
    const index = random(0, 1);
    return {
        title: `${types[index]} - #${makeId(random(5,25))}`,
        paragraph: generators[index](searchQuery),
    };
}

/** ----------- Dictionary ---------- */

/** ----------- Personal ------------ */
const personal = {
    subjectIs: ["She", "He"],
    subjectAre: ["They", "You", "We"],
    subjectAm: "I",
    adjectives: [
        "big",
        "fat",
        "thin",
        "clean",
        "fast",
        "slow",
        "smart",
        "stupid",
        "ugly",
        "dirty",
        "dry",
        "simple",
        "hard",
    ],
    comparatives: [
        "bigger",
        "slower",
        "fastest",
        "politer",
        "more serious",
        "more boring",
        "stronger",
        "weaker",
        "kinder",
        "freer",
        "larger",
    ],
    superaltives: [
        "biggest",
        "best",
        "smallest",
        "ugliest",
        "cleanest",
        "stupidest",
        "worst",
        "most emotional",
        "funniest",
        "most inteligent",
    ],
    nouns: [
        "girl",
        "boy",
        "dog",
        "wife",
        "husband",
        "cat",
        "mango",
        "apple",
        "pizza",
        "tourist",
        "lori",
    ],
    rest: [
        "to ever exist in this system",
        "that has been here for years!",
        "to be in any country in the world, OMG!",
        "which btw is awful to have happen",
    ],
};

/**
 * @param {string} searchQuery
 */
function generatePersonalParagraph(searchQuery) {
    let paragraph = searchQuery + " " + (random(0, 1) ? "is" : "are") + " ";

    const adjectiveIndex = random(0, 2);

    paragraph += adjectiveIndex === 1 ? " a " : " the ";
    paragraph +=
        adjectiveIndex === 0
            ? getRandomItem(personal.adjectives)
            : adjectiveIndex === 1
            ? getRandomItem(personal.comparatives)
            : getRandomItem(personal.superaltives);
    paragraph += " ";

    paragraph += getRandomItem(personal.nouns) + " ";
    paragraph += getRandomItem(personal.rest);

    return paragraph;
}

/** ----------- Research ------------ */
const researchInfo = {
    openings: [
        "Researchers#FROM have #VERB that #SEARCH_QUERY #CAUSE_VERB#TIME_INFO#INFO",
        "#SEARCH_QUERY - #INFO",
        "Statistics of #STATS_DESCRIBER show that #SEARCH_QUERY #VERB #INFO",
    ],
    froms: [
        "Scottland",
        "England",
        "Arabia",
        "UK",
        "USA",
        "Uganda",
        "Russia",
        "Switzerland",
    ],
    discoveryVerbs: ["discovered", "found", "ruled", "prooved", "concluded"],
    researchVerbs: [
        "cause",
        "inflict",
        "affect",
        "deviate",
        "increase",
        "decrease",
        "annihilate",
    ],
    timeInfos: ["at #TIME", "on #DATE"],
    preDescribers: ["a", "the"],
    infos: [
        "the populations in Mars. They were once a great nation, but now...",
        "the idea that she left me...",
        "the thing itself indeed...",
        "the right thing to do in the closed big circular room. How they did it is another story...",
        "mass flu in kindergartens around the world. Here is the solution...",
    ],
    statsOrigins: [
        "patients",
        "gorillas",
        "czecks",
        "generals",
        "kittens",
        "windows",
        "aliens",
        "magical books",
        "scriptures",
        "apples",
    ],
};

function generateResearchParagraph(searchQuery) {
    let paragraph = getRandomItem(researchInfo.openings);
    paragraph = paragraph.replace(
        "#FROM",
        random(0, 1) ? "" : ` from ${getRandomItem(researchInfo.froms)}`
    );
    paragraph = paragraph.replace(
        "#VERB",
        getRandomItem(researchInfo.discoveryVerbs)
    );
    paragraph = paragraph.replace("#SEARCH_QUERY", searchQuery);
    paragraph = paragraph.replace(
        "#PRE_DESCRIBERS",
        getRandomItem(researchInfo.preDescribers)
    );

    const time = random(-1, 1);
    paragraph = paragraph.replace(
        "#CAUSE_VERB",
        `${time === 1 ? " will " : ""}${getRandomItem(researchInfo.researchVerbs)}${
            time === -1 ? "ed" : time === 0 ? "s" : ""
        }`
    );

    if (time === -1) {
        const date = randomDate();
        const timeOrDate = random(0, 1);
        let timeInfo = researchInfo.timeInfos[timeOrDate];

        if (timeOrDate) {
            timeInfo = timeInfo.replace("#DATE", date.toDateString());
        } else {
            timeInfo = timeInfo.replace(
                "#TIME",
                date.toTimeString().slice(0, 8)
            );
        }

        paragraph = paragraph.replace("#TIME_INFO", `, ${timeInfo}, `);
    } else paragraph = paragraph.replace("#TIME_INFO", "");
    
    paragraph = paragraph.replace("#INFO", getRandomItem(researchInfo.infos));

    paragraph = paragraph.replace(
        "#STATS_DESCRIBER",
        `${random(1, 100)}% ${getRandomItem(researchInfo.statsOrigins)}`
    );

    return paragraph;
}
