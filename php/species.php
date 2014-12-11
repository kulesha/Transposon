<?php

class Species {
	public $species_id;
   	public $name;
    public $assembly;
    public $taxon;
    public $label;

    public function __construct($opts) {
        date_default_timezone_set('UTC');
    
        if (array_key_exists("species_id", $opts)) {
	  		   $this->species_id = $opts["species_id"];
        } else {
	  		   throw new InvalidArgumentException('Missing species_id');
        }	  
   		if (array_key_exists("name", $opts)) {
	  		$this->name = $opts["species_id"];
		} else {
	  		throw new InvalidArgumentException('Missing name');
		}	  
   		if (array_key_exists("taxon", $opts)) {
	  		$this->taxon = $opts["taxon"];
		} else {
	  		throw new InvalidArgumentException('Missing taxon');
		}	  

	   	if (array_key_exists("assembly", $opts)) {
	  		$this->assembly = $opts["assembly"];
		} else {
	  		throw new InvalidArgumentException('Missing assembly');
		}	  

   		if (array_key_exists("label", $opts)) {
	  		$this->label = $opts["label"];
		} else {
	  		throw new InvalidArgumentException('Missing label');
		}	  
	}

    public function species_id() { return $this->species_id; }     
    public function name() { return $this->name; }     
    public function taxon() { return $this->taxon; }     
    public function assembly() {	return $this->assembly; }     
    public function label() {	return $this->label; }     
}

require "dbadaptor.php";

$dbh = new DBAdaptor();
if ($dbh) {
    $data = $dbh->getAllSpecies();
    $res = array();
    $res["count"] = sizeof($data);
    $res["data"] = $data;
    header('Content-type: application/json');
    echo json_encode($res);
} else  {
    echo "Failed to connect to MySQL: " . mysqli_connect_error();
}

?>