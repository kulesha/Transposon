#!/usr/bin/env perl


print " Populate db \n";

use strict;
use warnings;

no warnings "uninitialized";

use File::Temp qw/tempfile/;
use Net::FTP;
use Getopt::Long;

#
# Default option values
#
my $help = 0;
my $host = 'ensembldb.ensembl.org';
my $user = 'anonymous';
my $port = 3306;
my $verbose = 0;
my $db_version = -1;
my $grch37;

my $useast = 0;
my $ensembl_genomes = 0;
my $species = undef;
my $api_version = -1;
my $skip = 0;
#
# Parse command-line arguments
#
my $options_ok = 
  GetOptions(
    "ue"            => \$useast,
    "eg"            => \$ensembl_genomes,
    "species=s"     => \$species,
    "db_version=i"  => \$db_version,
    "verbose"       => \$verbose,
    "grch37"        => \$grch37,
    "skip=i" => \$skip,
    "help"          => \$help);
($help or !$options_ok) && usage();

my $t = time;

$useast and $ensembl_genomes and
 die "Cannot test Ensembl Genomes on the US mirror.\n" .
  "Options \"ue\" and \"eg\" are mutually exclusive\n";

$useast and $host = "useastdb.ensembl.org";

$verbose and $verbose = 1;

$grch37 and $port = 3337;

if ($ensembl_genomes) {
  $host = "mysql-eg-publicsql.ebi.ac.uk";
  $port = 4157;
  $species = "arabidopsis thaliana"
    unless defined $species;
}

my $registry = 'Bio::EnsEMBL::Registry';

eval {
  require DBI;
  require DBD::mysql;
  require Bio::Perl;
  require Bio::EnsEMBL::Registry;
  require Bio::EnsEMBL::ApiVersion;
  require Bio::EnsEMBL::LookUp if $ensembl_genomes;
  $api_version = Bio::EnsEMBL::ApiVersion::software_version();
  $db_version = $api_version if $db_version == -1; #if it was still -1 then it wasn't set. Default is current API version
  $registry->load_registry_from_db(
    -host       => $host,
    -port       => $port,
    -user       => $user,
    -db_version => $db_version,
    -verbose    => $verbose,
  );
  $species = "human" unless defined $species;
  my $species_adaptor = Bio::EnsEMBL::Registry->get_DBAdaptor("$species", 'core');  
  print "Installation is good. Connection to Ensembl works and you can query the $species core database\n";
};

warn ' Registry loaded: ', time -$t , "s\n";

if ($@) {
  die "Error : $@\n";
}

my $ga  = $registry->get_adaptor( $species, 'Core', 'Gene' );

my $genes = $ga->fetch_all();

warn ' Genes retrieved: ' , time - $t, "s\n";

my $c = 0;
my $h = {};
my $result = [];
my $sid = 1;

open FG, ">>genes.txt" or die "$!";

open FE, ">>exons.txt" or die "$!";

while (my $g = shift @{$genes || []}){
  $c++;
  if ($c % 1000 == 0) {
    warn " - $c: ", time - $t, "s\n";
  }
  next if ($c < $skip);
#  last if ($c > 5);

  my $t = $g->canonical_transcript();

  my @exons = map {{ s => $_->start, e => $_->end}} @{$t->get_all_Exons()||[]};

  my $gso = {
	     id => $g->stable_id,
	     n => $g->display_id,
	     x => $g->display_xref->display_id,
	     r => $g->slice->seq_region_name,
	     s => $g->start,
	     e => $g->end,
	     o => $g->strand,
	     tid => $t->stable_id,
	     crs =>   $t->coding_region_start,
	     cre =>   $t->coding_region_end,
#	     exons => \@exons,
	    };

  if (my $prime5 = $t->five_prime_utr_Feature) {
    $gso->{p5s} = $prime5->start;
    $gso->{p5e} = $prime5->end;
  }

  if (my $prime3 = $t->three_prime_utr_Feature) {
    $gso->{p3s} = $prime3->start;
    $gso->{p3e} = $prime3->end;
  }
  
  push @$result , $gso;

  print FG join ("\t", $sid, $gso->{id}, $gso->{x} || $gso->{n}, 
    $gso->{r}, $gso->{s}, $gso->{e}, $gso->{o}, $gso->{tid},
      $gso->{p3s}, $gso->{p3e}, $gso->{crs}, $gso->{cre}, 
	$gso->{p5s}, $gso->{p5e}), "\n";
	
  foreach my $e (@exons) {
    print FE join ("\t", $gso->{tid}, $e->{s}, $e->{e}), "\n";
  }
  $h->{$g->analysis->logic_name} ++;


}

close FG;

close FE;

print "Loaded $c genes\n";
use Data::Dumper;
warn Dumper $h;

#warn Dumper $result->[0];

#warn Dumper $result;


#foreach my $g (@$result) {
#  warn join '*', $g->{id}, $g->{n}, "\n";
#}

