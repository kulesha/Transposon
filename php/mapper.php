<?php

date_default_timezone_set('UTC');
require "dbadaptor.php";
$dbh = new DBAdaptor();

$FORMAT = array(
    "TSP" => array ( 
        "input" => array( "id" => 0, "r" => 1, "s" => 2 , "e" => 3, "psup" => 4, "nsup" => 5, "gene"=> 6, "ori"=>7)
    )
);


class Entry {    
    public function __construct($opts) {
        foreach ($opts as $key => $value) {
            $this->$key = $value;
        }
        if (! isset( $this->r ) || ! isset( $this->s ) ) {
            throw new Exception('Region or start not set');
        }

        if((string)(int)$this->s != $this->s) {
            throw new Exception('Start is not numeric');
        }
        $this->s = (int)$this->s;
        
        if (isset( $this->e )) {
            if((string)(int)$this->e != $this->e) {
                throw new Exception('End is not numeric');
            }
            $this->e = (int)$this->e;
        } else {
            $this->e = 0;
        }        
        
        if (isset( $this->ori )) {
            $this->ori = ($this->ori == '-') ? -1 : 1;
        } else {
            $this->ori = 1;
        }
     
    }
}

class Mapper {
    public $file;
    public $format;
    public $data;
    public $map2genes;
        
    public function __construct($opts) {
        foreach( $opts as $key => $value ) {
            $this->$key = $value;
        }
        
        if (! isset($this->file)) {
	  	    throw new InvalidArgumentException('Missing filename');
        }	
        if (! isset($this->format)) {
	  	    throw new InvalidArgumentException('Missing format');
        }	
        $this->data = array();
        
        $this->POSITION = array(
        'flank5' => "5' Flank",
        'utr5' => "5' UTR",
        'gap5' => "5' Gap",
        'cds' => "CDS",
        'nct' => "NCT",
        'gap3' => "3' Gap",
        'utr3' => "3' UTR",
        'flank3' => "3' Flank"
        );
    
    }
    
    public function readData() {
        if ( $file = fopen($this->file  , 'r' ) ) {
            $input_format = $this->format["input"];
            while ( $line = fgets ($file, 4096) ) {
                $line = str_replace(PHP_EOL, '', $line);
                $fields = explode(',', $line);
                $params = array();
                foreach ( $input_format as $field => $position ) {
                    $params[$field] = $fields[$position];                    
                }
                try {
                    $e = new Entry($params);
                    array_push($this->data, $e);                    
                } catch (Exception $e) {
#                    echo $e->getMessage(), "<br/>";
#                    echo var_dump($e), "<br/>";
                }
        }
            fclose($file);
        }
        
        if ($this->map2genes) {
            $this->mapToGenes();
        }
    }
    
    public function sendData() {
        $res = array();
        $res["success"] = 1;
        $res["count"] = sizeof($this->data);
        $res["data"] = $this->data;
        header('Content-type: application/json');
        echo json_encode($res);        
    }

    public function getGenePosition($pos, $t) {
        
        if ($t->ori > 0) {        
            if ($pos < $t->gs) {
                return "flank5";
            } else {
                if ($pos <= $t->utr5e) {
                    return "utr5";
                } else {
                    if ($pos < $t->cdss ) {
                        return "gap5";                                        
                    } else {
                        if ($pos <= $t->cdse ) {
                            return 'cds';
                        } else {
                            if ($pos < $t->utr3s) {
                                return "gap3";
                            } else {
                                if ($pos <= $t->utr3e) {
                                    return "utr3";
                                } else {
                                    if ($pos < $t->ge) { // for non coding transcripts
                                        return 'nct';
                                    } else {
                                        return "flank3";
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return "Check the data";
        } else {
            if ($pos < $t->gs) {
                return "flank3";
            } else {
                if ($pos <= $t->utr3e) {
                    return "utr3";
                } else {                
                    if ($pos < $t->cdss ) {
                        return "gap3";                                        
                    } else {
                        if ($pos <= $t->cdse ) {
                            return 'cds';
                        } else {
                            if ($pos < $t->utr5s) {
                                return "gap5";
                            } else {
                                if ($pos <= $t->utr5e) {
                                    return "utr5";
                                } else {
                                    if ($pos < $t->ge) { // for non coding transcripts
                                        return 'nct';
                                    } else {
                                        return "flank5";
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return "Check the data";
        }
    }

    public function getExonNumber($pos, $t) {
        $i = 0;
        
        
        
        
        if ($t->strand > 0) {
            foreach($t->exons as $exon) {
                if ($pos < $exon->start) {
                    return $i ? "Intron $i" : ''; // -i                
                } else {
                    if ($pos <= $exon->end) {
                        return "Exon ".($i + 1);
                    }
                }
                $i++;
            }
        } else {
            foreach ($t->exons as $exon) {
                if ($pos > $exon->end) {
                    return $i ? "Intron $i" : ''; // -i
                } else {
                    if ($pos >= $exon->start) {
                        return "Exon ". ($i + 1);
                    }
                }
                $i++;
            }

        }
        return '';
    }

    public function mapToGenes() {
        foreach($this->data as &$e) {
            if ($e->gene) {
                if ($gene = $this->dbh->fetchGeneByName($e->gene)) {
               # echo var_dump($gene);
                $e->tid = $gene->transcript_id;    
                $e->utr3s = $gene->start3utr;
                $e->utr3e = $gene->end3utr;
                $e->utr5s = $gene->start5utr;
                $e->utr5e = $gene->end5utr;
                $e->cdss = $gene->startcds;
                $e->cdse = $gene->endcds;
            
                $e->gs = $gene->start;
                $e->ge = $gene->end;
                $e->gr = $gene->region;
                $e->ori = $gene->strand;
                
                $e->scol = $this->getGenePosition($e->s, $e);
                $e->ecol = $this->getGenePosition($e->e, $e);
        
                $e->spos = $this->POSITION[$e->scol];
                $e->epos = $this->POSITION[$e->ecol];
            
                $e->posS = $this->getExonNumber($e->s, $gene);
                $e->posE = $this->getExonNumber($e->e, $gene);
                }
            }

            $e->turl = "g.transcript_url";
        }
    }
}


if (isset ($_FILES["myfile"])) {
    try {        
        switch ($_FILES['myfile']['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No file sent.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Exceeded filesize limit.');
        default:
            throw new RuntimeException('Unknown errors.');
        }
    
        if ($_FILES['myfile']['size'] > 10000000) {
            throw new RuntimeException('Exceeded filesize limit.');
        }
        
    
        $opts["file"] = $_FILES["myfile"]["tmp_name"];
        $opts["format"] = $FORMAT["TSP"];
        $opts["dbh"] = $dbh;
        
        $params = array('map2genes' => 0, 'distance' => 5000);
        foreach( $params as $key => $value ) {
            if (array_key_exists($key, $_POST)) {
	  	        $opts[$key] = $_POST[$key];
            } else {
                $opts[$key] = $value;
            }
        }

        $mapper = new Mapper($opts);
                
        $mapper->readData();
                
        $mapper->sendData();
            
    } catch (RuntimeException $e) {
        echo $e->getMessage();
    }

} else {
    $res = array();
    $res["success"] = 0;
    $res["message"] = 'No file sent';
    header('Content-type: application/json');
    echo json_encode($res);        
    
}


?>