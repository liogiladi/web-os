import makeId from "/utils/makeId.js";

/**
 * @template T
 * @param {Array<T>} arr 
 * @returns {T} random item from array
 */
function getRandomItem(arr) {
    return arr.at(random(0, arr.length - 1));
}

/**
 * @param {Date} start 
 * @param {Date} end 
 * @param {number} startHour 0-23
 * @param {number} endHour 0-23
 * @returns a random date in given range
 */
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

/**
 * 
 * @param {number} min 
 * @param {number} max 
 * @returns random integer in given range
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + (min));
}

const TYPES = Object.freeze(["Research", "Personal"]);
const GENERATORS = Object.freeze([generateResearchParagraph, generatePersonalParagraph]);

/**
 * @param {string} searchQuery
 * @returns {{ title: string, paragraph: string }}
 */
export default function generateBrowserEntry(searchQuery) {
    const index = random(0, 1);
    return {
        title: `${TYPES[index]} - #${makeId(random(5,25))}`,
        paragraph: GENERATORS[index](searchQuery),
    };
}

/** ----------- Personal ------------ */

/**
 * Words to generate with a personal entry
 */
const PERSONAL_WORDS = Object.freeze({
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
});

/**
 * @param {string} searchQuery
 * @returns {string} personal pragraph based on search query
 */
function generatePersonalParagraph(searchQuery) {
    let paragraph = `<span class='bold'>${searchQuery}</span>` + " " + (random(0, 1) ? "is" : "are") + " ";

    const adjectiveIndex = random(0, 2);

    paragraph += adjectiveIndex === 1 ? " a " : " the ";
    paragraph +=
        adjectiveIndex === 0
            ? getRandomItem(PERSONAL_WORDS.adjectives)
            : adjectiveIndex === 1
            ? getRandomItem(PERSONAL_WORDS.comparatives)
            : getRandomItem(PERSONAL_WORDS.superaltives);
    paragraph += " ";

    paragraph += getRandomItem(PERSONAL_WORDS.nouns) + " ";
    paragraph += getRandomItem(PERSONAL_WORDS.rest);

    return paragraph;
}

/** ----------- Research ------------ */
const REASEARCH_WORDS = Object.freeze({
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
});

/**
 * @param {string} searchQuery
 * @returns {string} research pragraph based on search query
 */
function generateResearchParagraph(searchQuery) {
    let paragraph = getRandomItem(REASEARCH_WORDS.openings);
    paragraph = paragraph.replace(
        "#FROM",
        random(0, 1) ? "" : ` from ${getRandomItem(REASEARCH_WORDS.froms)}`
    );
    paragraph = paragraph.replace(
        "#VERB",
        getRandomItem(REASEARCH_WORDS.discoveryVerbs)
    );
    paragraph = paragraph.replace("#SEARCH_QUERY", `<span class='bold'>${searchQuery}</span>`);
    paragraph = paragraph.replace(
        "#PRE_DESCRIBERS",
        getRandomItem(REASEARCH_WORDS.preDescribers)
    );

    const time = random(-1, 1);
    paragraph = paragraph.replace(
        "#CAUSE_VERB",
        `${time === 1 ? " will " : ""}${getRandomItem(REASEARCH_WORDS.researchVerbs)}${
            time === -1 ? "ed" : time === 0 ? "s" : ""
        }`
    );

    if (time === -1) {
        const date = randomDate();
        const timeOrDate = random(0, 1);
        let timeInfo = REASEARCH_WORDS.timeInfos[timeOrDate];

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
    
    paragraph = paragraph.replace("#INFO", getRandomItem(REASEARCH_WORDS.infos));

    paragraph = paragraph.replace(
        "#STATS_DESCRIBER",
        `${random(1, 100)}% ${getRandomItem(REASEARCH_WORDS.statsOrigins)}`
    );

    return paragraph;
}
