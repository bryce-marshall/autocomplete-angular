import { Component, OnInit, Injectable } from '@angular/core';

@Injectable()
class TestCompCoordinator {
  constructor(){
    console.log("Constructed TestCompCoordinator");
  }

  method(){
    console.log("TestCompCoordinator method invoked.");
  }
}

@Component({
  selector: 'test-comp',
  templateUrl: './test-comp.component.html',
  styleUrls: ['./test-comp.component.css'],
  providers: [TestCompCoordinator]
})
export class TestCompComponent implements OnInit {

  constructor(private coordinator: TestCompCoordinator) { }

  ngOnInit() {
    console.log("TestCompComponent.ngOnInit");
    this.coordinator.method();
  }

}
