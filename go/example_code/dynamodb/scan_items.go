// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

// Create structs to hold info about new item
type ItemInfo struct {
	Plot   string  `json:"plot"`
	Rating float64 `json:"rating"`
}

type Item struct {
	Year  int      `json:"year"`
	Title string   `json:"title"`
	Info  ItemInfo `json:"info"`
}

// Get the movies with a minimum rating of 8.0 in 2011
func main() {
	min_rating := 8.0
	year := 2011

	// Initialize a session in us-west-2 that the SDK will use to load
	// credentials from the shared credentials file ~/.aws/credentials.
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2")},
	)

	if err != nil {
		log.Fatalf("Got error creating session: %s", err)
	}

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Create the Expression to fill the input struct with.
	// Get all movies in that year; we'll pull out those with a higher rating later
	filt := expression.Name("year").Equal(expression.Value(year))

	// Or we could get by ratings and pull out those with the right year later
	//    filt := expression.Name("info.rating").GreaterThan(expression.Value(min_rating))

	// Get back the title, year, and rating
	proj := expression.NamesList(expression.Name("title"), expression.Name("year"), expression.Name("info.rating"))

	expr, err := expression.NewBuilder().WithFilter(filt).WithProjection(proj).Build()

	if err != nil {
		log.Fatalf("Got error building expression: %s", err)
	}

	// Build the query input parameters
	params := &dynamodb.ScanInput{
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		FilterExpression:          expr.Filter(),
		ProjectionExpression:      expr.Projection(),
		TableName:                 aws.String("Movies"),
	}

	// Make the DynamoDB Query API call
	result, err := svc.Scan(params)

	if err != nil {
		log.Fatalf("Query API call failed: %s", err)
	}

	num_items := 0

	for _, i := range result.Items {
		item := Item{}

		err = dynamodbattribute.UnmarshalMap(i, &item)

		if err != nil {
			log.Fatalf("Got error unmarshalling: %s", err)
		}

		// Which ones had a higher rating?
		if item.Info.Rating > min_rating {
			// Or it we had filtered by rating previously:
			//   if item.Year == year {
			num_items += 1

			fmt.Println("Title: ", item.Title)
			fmt.Println("Rating:", item.Info.Rating)
			fmt.Println()
		}
	}

	fmt.Println("Found", num_items, "movie(s) with a rating above", min_rating, "in", year)
}
