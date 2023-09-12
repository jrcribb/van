import parse from "html-dom-parser";
const dummy = "dummy";
const quoteIfNeeded = (key) => /^[a-zA-Z_][a-zA-Z_0-9]+$/.test(key) ? key : `"${key}"`;
const attrsToVanCode = (attrs, children) => Object.keys(attrs).length === 0 ? "" :
    `{${Object.entries(attrs)
        .flatMap(([k, v]) => k !== dummy ? `${quoteIfNeeded(k)}: ${JSON.stringify(v)}` : [])
        .join(", ")}}${children.length > 0 ? "," : ""}`;
const filterDoms = (doms, skipEmptyText) => doms.filter(c => c.type === "tag" && c.name !== dummy ||
    c.type === "text" && (!skipEmptyText || /\S/.test(c.data)));
export const htmlToVanCode = (html, { indent = 2, skipEmptyText = false, htmlTagPred = s => s.toLowerCase() === s, } = {}) => {
    const domsToVanCode = (doms, prefix, skipEmptyText, tagsUsed) => doms.flatMap((dom) => {
        const suffix = !prefix && doms.length <= 1 ? "" : ",";
        if (dom.type === "text")
            return `${prefix}${JSON.stringify(dom.data)}${suffix}`;
        tagsUsed.add(dom.name);
        const localSkipEmptyText = skipEmptyText && dom.name !== "pre";
        const children = filterDoms(dom.children, localSkipEmptyText);
        return dom.children.length > 0 ? [
            `${prefix}${dom.name}(${attrsToVanCode(dom.attribs, children)}`,
            ...domsToVanCode(children, prefix + " ".repeat(indent), localSkipEmptyText, tagsUsed),
            `${prefix})${suffix}`,
        ] : `${prefix}${dom.name}(${attrsToVanCode(dom.attribs, children)})${suffix}`;
    });
    const doms = parse(html, { lowerCaseTags: false, lowerCaseAttributeNames: false });
    const tagsUsed = new Set;
    const code = domsToVanCode(filterDoms(doms, skipEmptyText), "", skipEmptyText, tagsUsed);
    const tags = [], components = [];
    for (const tag of tagsUsed)
        (htmlTagPred(tag) ? tags : components).push(tag);
    return { code, tags: tags.sort(), components: components.sort() };
};
