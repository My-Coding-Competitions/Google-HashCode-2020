const fs = require('fs');

const runTestCases = function (begin = 0, size = 5) {
    let testCases = ['a_example.txt', 'b_read_on.txt', 'c_incunabula.txt', 'd_tough_choices.txt', 'e_so_many_books.txt', 'f_Libraries_of_the_world.txt'];
    if (begin != 0 || size != 5) testCases = testCases.slice(begin, size);

    for (let test of testCases) {
        const _input = fs.readFileSync(`data/input/${test}`, 'utf8');
        const _output = processData(_input, test);
        fs.writeFileSync(`data/output/${test.replace('in', 'out')}`, _output);
    }
}

const strToArray = function (str) {
    return str.split(' ').map(o => parseInt(o));
}

const processData = (input, test) => {
    const _datasets = input.split('\n');
    let [noOfBooks, noOfLibrary, noOfScanningDays] = strToArray(_datasets[0]);
    let bookScores = strToArray(_datasets[1]);
    let libraries = [], currLine = 1;
    let maxScore = bookScores.reduce((a, b) => a + b);
    //let bookFreq = JSON.parse(fs.readFileSync(`data/store/${test.replace("txt", "json")}`, 'utf8'));
    for (let i = 0; i < noOfLibrary; i++) {
        let [noOfBookSignupDays, noOfBookShippingDays] = strToArray(_datasets[currLine + 1]).slice(1, 3);
        let books = strToArray(_datasets[currLine + 2]).sort((a, b) => bookScores[b] - bookScores[a]);
        let totalBooks = (noOfBookShippingDays * (noOfScanningDays - noOfBookSignupDays));
        totalBooks = Math.min(books.length, totalBooks);
        let bookWeight = calcScore(books, totalBooks, bookScores, {});
        //console.log(totalBooks,books.length)
        let bookDispatchRate = 1;//totalBooks / books.length;
        let bkW = bookWeight;
        let _sDays = noOfBookSignupDays;

        if (test == "f_Libraries_of_the_world.txt")
            bookDispatchRate = books.length;

        let priority = (bkW * bookDispatchRate) / _sDays;
        //console.log("bkw", i, bkW);
        libraries.push({
            "LIB_INDEX": i,
            "BOOK_WEIGHT": bookWeight,
            "PRIORITY": priority,
            "BOOKS": books,
            "NO_OF_SIGNUP_DAYS": noOfBookSignupDays,
            "NO_OF_BOOKSHIP_PER_DAY": noOfBookShippingDays
        });
        currLine += 2;
    }

    let result = [], outputFormat;
    result = fnBookScanningSmallInput(libraries, noOfScanningDays, bookScores);
    console.log(resultPerformance(result, bookScores, maxScore));
    outputFormat = [result.length];

    for (let res of result) {
        outputFormat.push(res.slice(0, 2).join(" "));
        outputFormat.push(res[2].join(" "));
    }
    return outputFormat.join("\n");
}

const calcScore = (books, totalBooks, bookScores, bookScanned) => {
    let libScore = 0, bookCount = 0;
    for (let bk of books) {
        if (bookScanned[bk]) continue;
        libScore += bookScores[bk];
        if (++bookCount == totalBooks) break;
    }
    return [libScore,bookCount];
}

const resultPerformance = function (result, bookScore, maxScore) {
    let score = result.reduce((a, b, i) => [...((i == 1) ? a[2] : a), ...b[2]])
                      .reduce((a, b, i) => ((i == 1) ? bookScore[a] : a) + bookScore[b]);

    return [score, maxScore, (score / maxScore) * 100];
}

const getNextLibrary = function (Libraries, daysRemaining, bookScores, bookScanned) {
    let bestLibrary, maxPriority = 0;

    console.log(daysRemaining);
    for (let lib of Libraries) {
        if (lib["Processed"]) continue;

        let books = lib.BOOKS;
        let noOfLibSignupDays = lib.NO_OF_SIGNUP_DAYS, bookScanPerday = lib.NO_OF_BOOKSHIP_PER_DAY;
        let daysLeft = daysRemaining - noOfLibSignupDays;
        if (daysLeft <= 0) continue;
        let totalBooks = bookScanPerday * daysLeft;
        totalBooks = Math.min(books.length, totalBooks);
        let [bookWeight, bookCount] = calcScore(books, totalBooks, bookScores, bookScanned);
        //console.log(totalBooks, bookCount);
        let priority = (bookWeight * bookCount) / noOfLibSignupDays;
        //console.log(priority,maxPriority);
        if (priority >= maxPriority) {
            maxPriority = priority;
            bestLibrary = lib;
            console.log("lib=> ",lib);
           // console.log(bestLibrary);
        }
    }

    console.log("best=> ",bestLibrary);

    bestLibrary["Processed"] = true;

    return bestLibrary;
}

const fnBookScanningSmallInput = function (Libraries, noOfScanningDays, bookScores, useRand = false) {
    let bookScanned = {}, scannedResult = {}, scannedLibrary = [];
    let lastSignupDay = -1;

    if (!useRand)
        Libraries = Libraries.sort((a, b) => (b.PRIORITY - a.PRIORITY));

    //console.log(Libraries);
    let lib, daysRemaining = noOfScanningDays;
    while (true) {
        lib = getNextLibrary(Libraries, daysRemaining, bookScores, bookScanned);
        let libIndex = lib.LIB_INDEX;
        lastSignupDay += lib.NO_OF_SIGNUP_DAYS;
        daysRemaining -= lib.NO_OF_SIGNUP_DAYS;
        //console.log(lastSignupDay, daysRemaining, lib.NO_OF_SIGNUP_DAYS);
        let shippingDay = lastSignupDay + 1;
        let books = lib.BOOKS;
        let noOfBooksPerDay = lib.NO_OF_BOOKSHIP_PER_DAY;
        scannedResult[libIndex] = [];
        scannedLibrary.push(libIndex);

        while (shippingDay <= noOfScanningDays) {
            let b, bookIndex = -1, lenBook = books.length;
            for (b = 0; b < noOfBooksPerDay; b++) {
                let book, isScanned;
                do {
                    bookIndex++;
                    book = books[bookIndex];
                    isScanned = bookScanned[book];
                }
                while (isScanned && bookIndex < lenBook);
                //console.log(bookIndex, lenBook);
                if (bookIndex == lenBook) break;
                scannedResult[libIndex].push(book);
                //console.log(scannedResult);
                bookScanned[book] = true;
            }
            shippingDay++;
        }

        if (daysRemaining <= 0) break;

    }

    let result = [];
    //console.log(scannedLibrary);
    for (let lib of scannedLibrary) {
        let bkScanned = scannedResult[lib];
        if (bkScanned.length)
            result.push([lib, bkScanned.length, bkScanned]);
    }

    return result;
}


//const 
console.clear();
console.log("running.......");
runTestCases(0,1);