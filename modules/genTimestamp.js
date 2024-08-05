// WIP... use en-US format? prefer UTC?
function genTimestamp() {
    const start = Date.now();
    now = new Date(start)
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hours24: 'true',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    const regex1 = /[:/]+/g;
    const regex2 = /[ ]+/g;

    return now.toLocaleDateString('fr-FR', options).replace(regex1, '-').replace(regex2, '_')
}
module.exports = { genTimestamp };