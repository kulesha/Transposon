function sleep(millis, callback) {
    setTimeout(function() { callback(); }, millis);
}

// Define the app, ngSanitize is needed to enable passing plain html into ng-repeat
var myApp = angular.module('geneInfoApp', ['ngSanitize', 'ngCsv']);

myApp.controller('geneInfoCtrl', ['$scope', '$http', '$sce', '$location', '$anchorScroll', '$window', function ($scope, $http, $sce, $location, $anchorScroll, $window) { 
     $scope.formInfo = {
        gene: "", //"ARSE\nBRCA2", 
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


    }
    
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
                        } else {
                            $scope.geneInfo.transcript.start5 = f.end +1;
                            $scope.geneInfo.transcript.end5 = t1.end;
                            $scope.geneInfo.transcript.start3 = t1.start;
                            $scope.geneInfo.transcript.end3 = t.Translation.start-1;

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