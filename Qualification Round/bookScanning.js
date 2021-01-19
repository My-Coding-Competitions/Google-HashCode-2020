const fs = require('fs');

/**
 * 
 * @param {number} begin - index of the first test case
 * @param {number} size - number of test cases to run
 * @description 
 * Runs testcases within supplied range, extracts testcases from data/input folder,
 * processes the extracted data and writes corresponding output into 
 * data/output folder.
 */
const runTestCases = function(begin = 0, size = 5){   
    let testCases = ['a_example.txt', 'b_read_on.txt', 'c_incunabula.txt', 
                     'd_tough_choices.txt', 'e_so_many_books.txt',
                     'f_Libraries_of_the_world.txt'
                    ];
                    
    if(begin != 0 || size != 5) testCases = testCases.slice(begin,size);
    
    //read testcase from file, process and write to Output
    for(let test of testCases){
        const _input = fs.readFileSync(`data/input/${test}`, 'utf8');
        const _output = processData(_input, test);
        fs.writeFileSync(`data/output/${test.replace('in', 'out')}`, _output);
    }    
}

/**
 * 
 * @param {string} str - space delimited string
 * @returns {number[]} - list of integers
 * @description parses space delimited strings into a list of integers
 */
const strToArray = function (str) {
    return str.split(' ').map(o => parseInt(o));
}


/**
 * 
 * @param {string} input - raw testcase input from file.
 * @param {string} noOfScanningDays - Number of days for scanning.
 * @returns {Object[]} - returns libraries, their meta-datas and assigned priorities.
 * @description
 * parses string into List of library data
 * computes priority for each library based on (
 * library Books Score(aka bookWeight), bookDispatchRate(
 *  for most testCases its constant except for type f which is directly
 *  proportional to each library bookLength
 *) and noOfBookSignupDays
 *)processes and schedules books in order of priority
 */
const processData = (input,test)=> {
    const _datasets = input.split('\n');
    let [noOfBooks, noOfLibrary, noOfScanningDays] = strToArray(_datasets[0]);
    let bookScores = strToArray(_datasets[1]);
    let libraries = [], currLine = 1;
    let maxScore = bookScores.reduce((a, b) => a + b);

    for (let i = 0; i < noOfLibrary; i++) {
        let [noOfBookSignupDays, noOfBookShippingDays] = strToArray(_datasets[currLine + 1]).slice(1, 3);
        let books = strToArray(_datasets[currLine + 2]);
        books = books.sort((a, b) => bookScores[b] - bookScores[a]);
        let totalBooks = (noOfBookShippingDays * (noOfScanningDays - noOfBookSignupDays));
        totalBooks = Math.min(books.length, totalBooks);
        let bookWeight = books.slice(0, totalBooks).reduce((a, b, i) => ((i == 1) ? bookScores[a] : a) + bookScores[b]);
        
        let bookDispatchRate = 1;

        if (test == "f_Libraries_of_the_world.txt") bookDispatchRate = books.length;

        let priority = (bookWeight * bookDispatchRate) / noOfBookSignupDays;

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
    result = fnBookScanning(libraries, noOfScanningDays, bookScores);
    const performance = resultPerformance(result,bookScores,maxScore);
    console.log(performance);
    outputFormat = [result.length];

    for (let res of result) {
        outputFormat.push(res.slice(0, 2).join(" "));
        outputFormat.push(res[2].join(" "));
    }
    return outputFormat.join("\n");
}


/**
 * 
 * @param {number[][]} result - book scanning algorithm output(resultFormat => [[libIndex, len(booksScanned), booksScanned]]).
 * @param {Object[]} bookScore - An Hashmap of all books in the system and their corresponding bookScore.
 * @param {number} maxScore - A sum of all available book scores in the system.
 * @returns {number[]} - returns [score, maxScore, percentageScore]
 * @description Evaluate Algorithm performance locally before uploading to hashcode judge system. 
 * It compares scores of all books in the system(maxScore) to the overall score of books scanned(score).
 */
const resultPerformance = function (result, bookScore,maxScore) {
    let score = result.reduce((a, b, i) => [...((i == 1) ? a[2] : a), ...b[2]])
                      .reduce((a, b, i) => ((i == 1) ? bookScore[a] : a) + bookScore[b]);

    return [score, maxScore, (score / maxScore) * 100];
}

/**
 * 
 * @param {Object[]} Libraries - A list of library(Hashmap).
 * @param {number} noOfScanningDays - Number of days for scanning.
 * @returns {number[][]} - returns libraries, number of bookScanned in each library and the corresponding books.
 * @description Algorithm that schedules books for scanning.
 */
const fnBookScanning = function (Libraries, noOfScanningDays) {
    let bookScanned = {}, scannedResult = {}, scannedLibrary = [];
    let lastSignupDay = -1;
    
    Libraries = Libraries.sort((a, b) => (b.PRIORITY - a.PRIORITY));

    for (let lib of Libraries) {
        let libIndex = lib.LIB_INDEX;
        lastSignupDay += lib.NO_OF_SIGNUP_DAYS;
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
                if (bookIndex == lenBook) break;
                scannedResult[libIndex].push(book);
                bookScanned[book] = true;
            }
            shippingDay++;
        }

        if (lastSignupDay >= noOfScanningDays) break;
    }


    let result = [];
    for (let lib of scannedLibrary) {
        let bkScanned = scannedResult[lib];
        if (bkScanned.length)
        result.push([lib, bkScanned.length, bkScanned]);
    }

    return result;
}

//run test cases 
console.clear();
console.log("running.......");
runTestCases(0,6);