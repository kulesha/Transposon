function sleep(millis, callback) {
    setTimeout(function() { callback(); }, millis);
}

var labels = {
    'flank5' : "5' Flank",
    'utr5' : "5' UTR",
    'gap5' : "5' Gap",
    'cds' : "CDS",
    'gap3' : "3' Gap",
    'utr3' : "3' UTR",
    'flank3' : "3' Flank"
};

function getExon(pos, t) {
    var i = 0;
    if (t.strand > 0) {
    for (var j in t.Exon) {
        if (pos < t.Exon[j].start) {
            return i ? "Intron " + i : ''; // -i
            return -i;
        } else {
            if (pos <= t.Exon[j].end) {
                //return i+1;
                return "Exon " + (i + 1);
            }
        }
        i++;
    }
    } else {
        for (var j in t.Exon) {
            if (pos > t.Exon[j].end) {
                //return -i;
                return i ? "Intron " + i : ''; // -i
            } else {
                if (pos >= t.Exon[j].start) {
                  //  return i+1;
                    return "Exon " + (i + 1);
                }
            }
            i++;
        }

    }
    return '';
    return 0;
}

function getPosition( pos, t) {
    var cl = getClass(pos, t);
    return labels[ cl ];
}

function getClass( pos, t) {
    if (t.ori > 0) {
    if (pos < t.gs) {
        return "flank5";
    } else {
        if (pos <= t.utr5e) {
            return "utr5";
        } else {
            if (pos < t.cdss ) {
                return "gap5";                                        
            } else {
                if (pos <= t.cdse ) {
                    return 'cds';
                } else {
                    if (pos < t.utr3s) {
                        return "gap3";
                    } else {
                        if (pos <= t.utr3e) {
                            return "utr3";
                        } else {
                            return "flank3";
                        }
                    }
                }
            }
        }
    }
    return "Check the data";
    } else {
        if (pos < t.gs) {
            return "flank3";
        } else {
            if (pos <= t.utr3e) {
                return "utr3";
            } else {
                
            if (pos < t.cdss ) {
                return "gap3";                                        
            } else {
                if (pos <= t.cdse ) {
                    return 'cds';
                } else {
                    if (pos < t.utr5s) {
                        return "gap5";
                    } else {
                        if (pos <= t.utr5e) {
                            return "utr5";
                        } else {
                            return "flank5";
                        }
                    }
                }
            }
        }
    }
    return "Check the data";
    }
}


// Define the app, ngSanitize is needed to enable passing plain html into ng-repeat
var myApp = angular.module('geneInfoApp', ['ngSanitize', 'ngCsv']);

myApp.controller('geneInfoCtrl', ['$scope', '$http', '$sce', '$location', '$anchorScroll', '$window', function ($scope, $http, $sce, $location, $anchorScroll, $window) { 
     $scope.formInfo = {
        gene: "", //"ARSE\nBRCA2", 
        //fname: "http://www.ebi.ac.uk/~ek/all_1043.csv",
         fname: "data/test.csv",
        width: 100, 
        coding: false, 
        restServer: 'http://grch37.rest.ensembl.org',
        eServer: 'http://grch37.ensembl.org',
        source: 'elatest',
        division: 'ensembl'
        
    };

    $scope.serverList = [
        { name: 'elatest', division: 'ensembl', label: 'Ensembl ( GRCh38 )' , url: 'http://rest.ensembl.org', eurl: 'http://www.ensembl.org'},
        { name: 'egrch37', division: 'ensembl', label: 'Ensembl ( GRCh37 )' , url: 'http://grch37.rest.ensembl.org', eurl: 'http://grch37.ensembl.org'}
// eg reset is too slow        { name: 'eplants', division: 'plants', label: 'Plants' , url: 'http://rest.ensemblgenomes.org', eurl: 'http://plants.ensembl.org'}
    ];
        
                                      
    // the rest api call will fill this object
    $scope.geneInfo = {}; 
    
    var self = this;
    self.species = 'homo_sapiens';
    
    $scope.results = [];
    $scope.valid = 0;
    $scope.total = 0;
    
     $scope.getArray = [{a: 1, b:2}, {a:3, b:4}];
   $scope.getResults = function() {
    var ar = new Array();
    for (var i in $scope.results) {
        var gene = $scope.results[i];
        var r = {name: gene.display_name,
                 chr: gene.seq_region_name,
                 start: gene.start,
                 end: gene.end,
                 strand: gene.strand,
                 et: gene.transcript.id,
                 ts: gene.transcript.start,
                 te : gene.transcript.end,
                 start5: gene.transcript.start5,
                 end5: gene.transcript.end5,
                 startcds: gene.transcript.Translation.start,
                 endcds: gene.transcript.Translation.end, 
                 start3: gene.transcript.start3,
                 end3: gene.transcript.end3
                };
        ar.push(r);
    }
       return ar;
   };
    
    $scope.getHeader = function () {
        return ['Gene Name', 'Region','Start', 'End', 'Strand', 'Transcript', 'Tr.Start', 'Tr.End', '5UTR Start', '5UTR End', , 'CDS Start', 'CDS End', '3UTR Start', '3UTR End'];
    };
    
    $scope.getHeader2 = function () {
        return ['Sample','Region','PositiveBrk', 'PositiveLoc','PositiveExon','NegativeBrk', 'NegativeLoc', 'NegativeExon', 'Gene'];
    };
   
    $scope.getResults2 = function() {
    var ar = new Array();
    for (var i in $scope.transposons) {
        var e = $scope.transposons[i];
        if (e) {
            var r = {sample: e.id,
                    chr: e.r,
                 start: e.s,
                 startP: e.scol,
                 startE: e.posS,
                 end: e.e,
                 endP: e.ecol,
                 endE: e.posE, 
                  gene: e.g
                };
            ar.push(r);
            }
    }
        
       return ar;
   };
   
    this.getGene = function(gene) {
        var o = { display_name: gene };
        $scope.message = " Looking for " + gene;
        console.log(" Looking for " + gene);
        $scope.total++;
         // first we look for the gene
        var url = $scope.formInfo.restServer + '/lookup/symbol/'+self.species+'/' + gene
                + '?content-type=application/json;expand=1';

        $http.get(url).success(function(data){
            // hooray - we have found the gene
            o = data;
//            console.log(o);
            o.gene_url = $scope.formInfo.eServer + '/'+self.species+'/Gene/Summary?g=' + data.id;
            
            // now let's get the sequence
            for (var i in data.Transcript) {
                var t = data.Transcript[i];
                if (t.is_canonical === "1") {
                    o.transcript = t;
                    o.transcript_url = $scope.formInfo.eServer + '/'+self.species+'/Transcript/Summary?t=' + t.id;
                    var cds = $scope.formInfo.restServer + '/map/cds/'+t.id+'/1..3000000?content-type=application/json';
                    var t1 = t;
                    if (t1.Translation) {
                    
                    $http.get(cds).success(function(data){
                        var f = data.mappings[0];
                        data.mappings.pop();
                        
                        var l = data.mappings.pop();
                        if (o.strand > 0) {
                            if (t1.start == t1.Translation.start) {
                                o.transcript.start5 = 0;
                                o.transcript.end5 = 0;                                
                            } else {
                                o.transcript.start5 = t1.start;
                                o.transcript.end5 = t1.Translation.start-1;
                            }
                            
                            if (t1.end == t1.Translation.end) {
                                o.transcript.start3 = 0;
                                o.transcript.end3 = 0;                                
                            } else {
                                o.transcript.start3 = t1.Translation.end +1;
                                o.transcript.end3 = t1.end;
                            }
                        } else {
                            if (t1.end == t1.Translation.end) {
                                o.transcript.start5 = 0;
                                o.transcript.end5 = 0;
                            
                            } else {
                                o.transcript.start5 = f.end +1;
                                o.transcript.end5 = t1.end;
                            
                            }
                            if (t1.start == t1.Translation.start) {
                                o.transcript.start3 = 0;
                                o.transcript.end3 = 0;
                            } else {
                                o.transcript.start3 = t1.start;
                                o.transcript.end3 = t1.Translation.start-1;
                            }
                            
                        }                        
                    });
                    } else {
                        if (1) {
                            o.transcript.start5 = 0;
                            o.transcript.end5 = 0;
                            o.transcript.start3 = 0;
                            o.transcript.end3 = 0;
                            o.transcript.Translation = {start: 0, end: 0};
                            
                        }

                    }
                    break;
                }
            }
            $scope.results.push(o);
            $scope.valid++;
        }).error(function(data, status, header, config){
            if (status === 400) {
                $scope.message = data.error;
            }
            o.seq_region_name = data.error;
            $scope.results.push(o);
        });


    };

    this.fetchGene = function(gene) {
        var o = { display_name: gene };
        $scope.message = " Looking for " + gene;
        console.log(" Looking for " + gene);
        $scope.total++;
         // first we look for the gene
        var url = $scope.formInfo.restServer + '/lookup/symbol/'+self.species+'/' + gene
                + '?content-type=application/json;expand=1';

        $http.get(url).success(function(data){
            // hooray - we have found the gene
            o = data;
//            console.log(o);
            o.gene_url = $scope.formInfo.eServer + '/'+self.species+'/Gene/Summary?g=' + data.id;
            
            // now let's get the sequence
            for (var i in data.Transcript) {
                var t = data.Transcript[i];
                if (t.is_canonical === "1") {
                    o.transcript = t;
                    o.transcript_url = $scope.formInfo.eServer + '/'+self.species+'/Transcript/Summary?t=' + t.id;
                    var cds = $scope.formInfo.restServer + '/map/cds/'+t.id+'/1..3000000?content-type=application/json';
                    var t1 = t;
                    if (t1.Translation) {
                    
                    $http.get(cds).success(function(data){
                        var f = data.mappings[0];
                        data.mappings.pop();
                        
                        var l = data.mappings.pop();
                        if (o.strand > 0) {
                            if (t1.start == t1.Translation.start) {
                                o.transcript.start5 = 0;
                                o.transcript.end5 = 0;                                
                            } else {
                                o.transcript.start5 = t1.start;
                                o.transcript.end5 = t1.Translation.start-1;
                            }
                            
                            if (t1.end == t1.Translation.end) {
                                o.transcript.start3 = 0;
                                o.transcript.end3 = 0;                                
                            } else {
                                o.transcript.start3 = t1.Translation.end +1;
                                o.transcript.end3 = t1.end;
                            }
                            
                            o.transcript.startCds = t1.Translation.start;
                            o.transcript.endCds = t1.Translation.end;

                        } else {
                            if (t1.end == t1.Translation.end) {
                                o.transcript.start5 = 0;
                                o.transcript.end5 = 0;
                            
                            } else {
                                o.transcript.start5 = f.end +1;
                                o.transcript.end5 = t1.end;
                            
                            }
                            if (t1.start == t1.Translation.start) {
                                o.transcript.start3 = 0;
                                o.transcript.end3 = 0;
                            } else {
                                o.transcript.start3 = t1.start;
                                o.transcript.end3 = t1.Translation.start-1;
                            }
                            o.transcript.startCds = t1.Translation.start;
                            o.transcript.endCds = t1.Translation.end;

                        }                        
                    });
                    } else {
                        if (1) {
                            o.transcript.start5 = 0;
                            o.transcript.end5 = 0;
                            o.transcript.start3 = 0;
                            o.transcript.end3 = 0;
                            o.transcript.Translation = {start: 0, end: 0};
                            
                        }

                    }
                    break;
                }
            }
            $scope.gHash[ o.display_name ] = o;
            $scope.valid++;
        }).error(function(data, status, header, config){
            if (status === 400) {
                $scope.message = data.error;
            }
        //    o.seq_region_name = data.error;
        //    $scope.results.push(o);
        });


    };

    this.find = function() {
        $scope.results = [];
        $scope.toFind = $scope.formInfo.gene.toUpperCase().split(/[\,\n\r]/);
//        console.log($scope.toFind);
        $scope.finished = 0;
        self.fetch(0);
        
                
//        for( var i in toFind) {
//            var gene = toFind[i].replace(/\s/g, '');
//        }        
    };
    
    this.fetch = function( i ) {
        if ($scope.toFind[i]) {
            var gene = $scope.toFind[i].replace(/\s/g, '');
            if (gene) {
                self.getGene(gene);
                i++;
                if (i === $scope.toFind.length) {
                    $scope.message = 'Done';
                    $scope.finished = 1;
                } else {
                    setTimeout(function() { self.fetch(i); }, 1000);
                }
            }
        } else {
            $scope.message = 'Done';
            $scope.finished = 1;
        }
    };

    
    this.calcPositions = function() {
  //      console.log($scope.gHash);
        for (var i in $scope.transposons ) {
                var t = $scope.transposons[i];
                
                if (t) {
                    var g = $scope.gHash[ t.g ];
//                    console.log(t.g);
//                    console.log(g);
                    
                    if (g) {
                        // find canonical transcript
                        var tl = g.transcript;
                        t.ori = tl.strand;         
                        t.gs = tl.start;
                        t.ge = tl.end;
                        t.tid = tl.id;
                        t.gr = tl.seq_region_name;
                        t.utr3s = tl.start3;
                        t.utr3e = tl.end3;
                        t.utr5s = tl.start5;
                        t.utr5e = tl.end5;
                        t.cdss = tl.startCds;
                        t.cdse = tl.endCds;
                        
                        t.spos = getPosition(t.s, t);
                        t.epos = getPosition(t.e, t);
                        
                        t.scol = getClass(t.s, t);
                        t.ecol = getClass(t.e, t);
                        
                        t.posS = getExon(t.s, tl);
                        t.posE = getExon(t.e, tl);
                        
                        $scope.transposons[i] = t;                        
                    }
              //      console.log(t);
                }
            }
            
    //        console.log($scope.transposons);
    };
    this.fetch_genes = function( i ) {
        if ($scope.toFind[i]) {
            var gene = $scope.toFind[i].replace(/\s/g, '');
            if (gene) {
                self.fetchGene(gene);
                i++;
                if (i === $scope.toFind.length) {
                    $scope.message = 'Done';
                    $scope.finished = 1;
                    this.calcPositions();                    
                } else {
                    setTimeout(function() { self.fetch_genes(i); }, 1000);
                }
            }
        } else {
            $scope.message = 'Done';
            $scope.finished = 1;
      //      console.log($scope.gHash);
            
            
        }
    };

    this.reset = function() {
        $scope.transposons = [];
        $scope.results = [];
    };
    
    this.getGeneData = function(gene) {
        // first we look for the gene
        var url = $scope.formInfo.restServer + '/lookup/symbol/'+self.species+'/' + gene
                + '?content-type=application/json;expand=1';
            
        $http.get(url).success(function(data){
        });
    };
    this.transposonSearch = function() {
        var fname = $scope.formInfo.fname;
        console.log(fname);
        self.reset();
        $http.get(fname).success(function(data){
            var entries = data.split(/[\n]/).filter(function(n) {return n != undefined });
        //    console.log(entries);
            
            $scope.genes = {};
            $scope.transposons = entries.map(function(item) {
                var edata = item.split(/,/);
                if (edata[0]) {
                    var g = edata[6];
                    if (g && g.match(/[A-Z|a-z]/) && g !== "Gene") {
                        $scope.genes[ g ] = { };                        
                           return { id: edata[0], r: edata[1], s : edata[2], e: edata[3], g: edata[6] };
                    }
                 
                }
            });
            
          //  console.log($scope.genes);
            
            $scope.toFind = Object.keys($scope.genes).sort();
            $scope.toFind.push('BRCA2'); // tmp fix 
            $scope.gHash = {};
            $scope.finished = 0;
            self.fetch_genes(0);
        });
        
        
    };
    
      // function that will be called on form submit
    this.findGene = function() {
        $scope.geneInfo = {};
        
        var gene = $scope.formInfo.gene.toUpperCase();
        console.log(gene);
        
        $scope.message = "Looking for " + gene;
                
        // first we look for the gene
        var url = $scope.formInfo.restServer + '/lookup/symbol/'+self.species+'/' + gene
                + '?content-type=application/json;expand=1';
            
        $http.get(url).success(function(data){
            // hooray - we have found the gene
            $scope.geneInfo = data;
            if ($scope.geneInfo.strand === 1) {
                $scope.geneInfo.strand_str = 'forward';
            } else {
                $scope.geneInfo.strand_str = 'reverse';
            }
            
            $scope.geneInfo.gene_url = $scope.formInfo.eServer + '/'+self.species+'/Gene/Summary?g=' + data.id;
            $scope.loading = true;
            
            // now let's get the sequence
            for (var i in data.Transcript) {
                var t = data.Transcript[i];
                if (t.is_canonical === "1") {
                    $scope.geneInfo.transcript = t;
                    $scope.geneInfo.transcript_url = $scope.formInfo.eServer + '/'+self.species+'/Transcript/Summary?t=' + t.id;
                    var cds = $scope.formInfo.restServer + '/map/cds/'+t.id+'/1..3000000?content-type=application/json';
                    var t1 = t;
                    $http.get(cds).success(function(data){
                        var f = data.mappings[0];
                        data.mappings.pop();
                        
                        var l = data.mappings.pop();
                        if ($scope.geneInfo.strand > 0) {
                            $scope.geneInfo.transcript.start5 = t1.start;
                            $scope.geneInfo.transcript.end5 = t.Translation.start-1;

                            $scope.geneInfo.transcript.start3 = t.Translation.end +1;
                            $scope.geneInfo.transcript.end3 = t1.end;
                            
                            $scope.geneInfo.transcript.startCds = t.Translation.start;
                            $scope.geneInfo.transcript.endCds = t.Translation.end;
                        } else {
                            $scope.geneInfo.transcript.start5 = f.end +1;
                            $scope.geneInfo.transcript.end5 = t1.end;
                            $scope.geneInfo.transcript.start3 = t1.start;
                            $scope.geneInfo.transcript.end3 = t.Translation.start-1;
                            $scope.geneInfo.transcript.startCds = t.Translation.start;
                            $scope.geneInfo.transcript.endCds = t.Translation.end;

                        }
                        
                        console.log(f);
                        console.log(l);
                        
                    });
                    break;
                }
            }
            $scope.message = '';
            
            console.log($scope.geneInfo);
            
        }).error(function(data, status, header, config){
            if (status === 400) {
                $scope.message = data.error;
            }
        });
        
    };
}
                                 ]
                );